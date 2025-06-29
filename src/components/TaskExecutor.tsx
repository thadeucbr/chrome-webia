import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, CheckCircle, AlertCircle, Clock, RefreshCw, Settings } from 'lucide-react';
import { TaskStep } from '../types';

interface TaskExecutorProps {
  steps: TaskStep[];
  onComplete: () => void;
  onCancel: () => void;
}

const TaskExecutor: React.FC<TaskExecutorProps> = ({ steps, onComplete, onCancel }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [executedSteps, setExecutedSteps] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isCheckingScript, setIsCheckingScript] = useState(false);

  const checkContentScript = async (): Promise<boolean> => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return false;

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('Timeout ao verificar content script');
          resolve(false);
        }, 3000);

        chrome.tabs.sendMessage(tab.id!, { type: 'PING' }, (response) => {
          clearTimeout(timeout);
          
          if (chrome.runtime.lastError) {
            console.log('Content script não encontrado:', chrome.runtime.lastError);
            resolve(false);
          } else {
            resolve(response?.success && response?.ready);
          }
        });
      });
    } catch (error) {
      console.error('Erro ao verificar content script:', error);
      return false;
    }
  };

  const injectContentScript = async (): Promise<boolean> => {
    try {
      setIsCheckingScript(true);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return false;

      console.log('🔄 Tentando injetar content script...');

      // Método 1: Usar chrome.scripting.executeScript
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
        console.log('✅ Script injetado via chrome.scripting');
      } catch (scriptingError) {
        console.log('❌ Erro com chrome.scripting:', scriptingError);
        
        // Método 2: Pedir para o background script injetar
        try {
          await chrome.runtime.sendMessage({
            type: 'INJECT_CONTENT_SCRIPT',
            tabId: tab.id
          });
          console.log('✅ Script injetado via background');
        } catch (backgroundError) {
          console.log('❌ Erro com background script:', backgroundError);
          return false;
        }
      }

      // Aguardar um pouco para o script carregar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se funcionou
      const isReady = await checkContentScript();
      console.log('🔍 Content script pronto:', isReady);
      
      return isReady;
    } catch (error) {
      console.error('❌ Erro ao injetar content script:', error);
      return false;
    } finally {
      setIsCheckingScript(false);
    }
  };

  const executeStep = async (step: TaskStep, index: number): Promise<boolean> => {
    try {
      setError(null);
      
      // Verificar se content script está disponível
      let isReady = await checkContentScript();
      
      if (!isReady) {
        console.log('Content script não encontrado, tentando injetar...');
        isReady = await injectContentScript();
        
        if (!isReady) {
          throw new Error('Não foi possível carregar o content script na página');
        }
      }

      // Enviar comando para o content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout ao executar passo'));
        }, 30000); // 30 segundos de timeout

        chrome.tabs.sendMessage(tab.id!, {
          type: 'EXECUTE_STEP',
          step: step
        }, (response) => {
          clearTimeout(timeout);
          
          if (chrome.runtime.lastError) {
            reject(new Error(`Erro de comunicação: ${chrome.runtime.lastError.message}`));
            return;
          }

          if (response?.success) {
            // Marcar como executado
            setExecutedSteps(prev => new Set([...prev, index]));
            resolve(true);
          } else {
            reject(new Error(response?.error || 'Erro desconhecido ao executar passo'));
          }
        });
      });
    } catch (error) {
      console.error('Erro ao executar passo:', error);
      throw error;
    }
  };

  const startExecution = async () => {
    setIsExecuting(true);
    setIsPaused(false);
    setError(null);

    try {
      for (let i = currentStepIndex; i < steps.length; i++) {
        if (isPaused) break;
        
        setCurrentStepIndex(i);
        
        try {
          await executeStep(steps[i], i);
          
          // Aguardar um pouco antes do próximo passo
          await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (stepError) {
          setError(`Erro no passo ${i + 1}: ${stepError.message}`);
          setIsExecuting(false);
          return;
        }
      }

      // Se chegou até aqui, todos os passos foram executados
      setIsExecuting(false);
      onComplete();
    } catch (error) {
      setError(`Erro geral: ${error.message}`);
      setIsExecuting(false);
    }
  };

  const pauseExecution = () => {
    setIsPaused(true);
    setIsExecuting(false);
  };

  const stopExecution = () => {
    setIsExecuting(false);
    setIsPaused(false);
    setCurrentStepIndex(0);
    setExecutedSteps(new Set());
    setError(null);
    onCancel();
  };

  const retryFromCurrent = () => {
    setError(null);
    startExecution();
  };

  const forceInjectScript = async () => {
    setError(null);
    const success = await injectContentScript();
    if (success) {
      setError(null);
    } else {
      setError('Não foi possível injetar o content script. Tente recarregar a página.');
    }
  };

  const getStepIcon = (index: number) => {
    if (executedSteps.has(index)) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (index === currentStepIndex && isExecuting) {
      return <Clock className="w-5 h-5 text-blue-500 animate-pulse" />;
    } else {
      return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Executando Tarefa
        </h3>
        <p className="text-sm text-gray-600">
          {executedSteps.size} de {steps.length} passos concluídos
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(executedSteps.size / steps.length) * 100}%` }}
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Erro na Execução</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              
              {error.includes('content script') && (
                <div className="mt-2 text-xs text-red-600">
                  <p>💡 <strong>Possíveis soluções:</strong></p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Recarregue a página atual (F5)</li>
                    <li>Verifique se a página permite scripts</li>
                    <li>Tente em uma página diferente</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={retryFromCurrent}
              className="flex items-center space-x-1 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Tentar Novamente</span>
            </button>
            
            {error.includes('content script') && (
              <button
                onClick={forceInjectScript}
                disabled={isCheckingScript}
                className="flex items-center space-x-1 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isCheckingScript ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                    <span>Injetando...</span>
                  </>
                ) : (
                  <>
                    <Settings className="w-3 h-3" />
                    <span>Forçar Injeção</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Steps List */}
      <div className="max-h-60 overflow-y-auto space-y-2">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center space-x-3 p-3 rounded-lg ${
              index === currentStepIndex && isExecuting
                ? 'bg-blue-50 border border-blue-200'
                : executedSteps.has(index)
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            {getStepIcon(index)}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">
                {step.description}
              </p>
              <p className="text-xs text-gray-500">
                {step.action} {step.target && `→ ${step.target}`}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-3">
        {!isExecuting && !isPaused && (
          <button
            onClick={startExecution}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Iniciar</span>
          </button>
        )}

        {isExecuting && (
          <button
            onClick={pauseExecution}
            className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Pause className="w-4 h-4" />
            <span>Pausar</span>
          </button>
        )}

        {isPaused && (
          <button
            onClick={startExecution}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Continuar</span>
          </button>
        )}

        <button
          onClick={stopExecution}
          className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Square className="w-4 h-4" />
          <span>Parar</span>
        </button>
      </div>
    </div>
  );
};

export default TaskExecutor;