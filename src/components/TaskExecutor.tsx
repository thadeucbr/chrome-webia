import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, CheckCircle, AlertCircle, Clock } from 'lucide-react';
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

  const executeStep = async (step: TaskStep, index: number) => {
    try {
      // Enviar comando para o content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.tabs.sendMessage(tab.id!, {
        type: 'EXECUTE_STEP',
        step: step
      });

      // Marcar como executado
      setExecutedSteps(prev => new Set([...prev, index]));
      
      // Aguardar um pouco antes do próximo passo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Erro ao executar passo:', error);
      return false;
    }
  };

  const startExecution = async () => {
    setIsExecuting(true);
    setIsPaused(false);

    for (let i = currentStepIndex; i < steps.length; i++) {
      if (isPaused) break;
      
      setCurrentStepIndex(i);
      const success = await executeStep(steps[i], i);
      
      if (!success) {
        setIsExecuting(false);
        alert(`Erro ao executar o passo: ${steps[i].description}`);
        return;
      }
    }

    setIsExecuting(false);
    onComplete();
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
    onCancel();
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