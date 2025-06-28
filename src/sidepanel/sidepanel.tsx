import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Settings, Sparkles, AlertCircle, Loader, ArrowLeft, ExternalLink } from 'lucide-react';
import OnboardingFlow from '../components/OnboardingFlow';
import TaskExecutor from '../components/TaskExecutor';
import { getSettings } from '../utils/storage';
import { aiService } from '../utils/aiService';
import { UserSettings, AIResponse } from '../types';

const SidePanel: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTask, setCurrentTask] = useState<AIResponse | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentView, setCurrentView] = useState<'main' | 'settings'>('main');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const userSettings = await getSettings();
      setSettings(userSettings);
      
      if (!userSettings.hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const handleSubmitInstruction = async () => {
    if (!instruction.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const response = await aiService.processInstruction(instruction);
      setCurrentTask(response);
      setInstruction('');
    } catch (error) {
      alert('Erro ao processar instrução. Verifique sua configuração.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTaskComplete = () => {
    setCurrentTask(null);
  };

  const handleTaskCancel = () => {
    setCurrentTask(null);
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  if (showOnboarding) {
    return (
      <div className="h-full overflow-y-auto">
        <OnboardingFlow
          onComplete={() => {
            setShowOnboarding(false);
            loadSettings();
          }}
        />
      </div>
    );
  }

  if (!settings?.isConfigured) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-800">
              Configuração Necessária
            </h2>
            <p className="text-sm text-gray-600">
              Configure sua IA antes de usar a extensão
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={openOptions}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Abrir Configurações
            </button>
            <button
              onClick={() => setShowOnboarding(true)}
              className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Iniciar Configuração Guiada
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <AnimatePresence mode="wait">
        {currentTask ? (
          <motion.div
            key="task-executor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <button
                onClick={handleTaskCancel}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Voltar</span>
              </button>
              <h1 className="text-lg font-semibold text-gray-800">
                Executando Tarefa
              </h1>
              <div className="w-16"></div> {/* Spacer */}
            </div>

            {/* Task Executor */}
            <div className="flex-1 overflow-y-auto p-4">
              <TaskExecutor
                steps={currentTask.steps}
                onComplete={handleTaskComplete}
                onCancel={handleTaskCancel}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="main-interface"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-7 h-7 text-blue-600" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-800">
                    Assistente IA
                  </h1>
                  <p className="text-xs text-gray-500">
                    {settings.selectedProvider} • {settings.selectedModel}
                  </p>
                </div>
              </div>
              <button
                onClick={openOptions}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Quick Examples */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-800">
                  💡 Exemplos Rápidos
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    'Abra o Gmail e verifique novos emails',
                    'Faça uma postagem no LinkedIn sobre produtividade',
                    'Consulte o clima para hoje no Google',
                    'Pesquise por apartamentos para alugar',
                    'Abra o YouTube e procure por tutoriais de React'
                  ].map((example, index) => (
                    <button
                      key={index}
                      onClick={() => setInstruction(example)}
                      className="text-left text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-3 rounded-lg transition-colors border border-blue-100 hover:border-blue-200"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instruction Input */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-800">
                  🎯 O que você quer que eu faça?
                </label>
                <div className="relative">
                  <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="Ex: Faça uma postagem de bom dia no meu LinkedIn"
                    className="w-full p-4 pr-14 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    rows={4}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitInstruction();
                      }
                    }}
                  />
                  <button
                    onClick={handleSubmitInstruction}
                    disabled={!instruction.trim() || isProcessing}
                    className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessing ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">
                  💡 Dicas para Melhores Resultados
                </h3>
                <ul className="text-xs text-blue-800 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600">•</span>
                    <span>Seja específico sobre o que quer fazer</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600">•</span>
                    <span>Mencione o site se necessário (ex: "no LinkedIn")</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600">•</span>
                    <span>Use linguagem natural e simples</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-600">•</span>
                    <span>Divida tarefas complexas em passos menores</span>
                  </li>
                </ul>
              </div>

              {/* Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  📊 Status da Configuração
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Provedor:</span>
                    <span className="font-medium text-gray-800">{settings.selectedProvider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Modelo:</span>
                    <span className="font-medium text-gray-800">{settings.selectedModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-green-600">✓ Configurado</span>
                  </div>
                </div>
              </div>

              {/* Help Link */}
              <div className="text-center">
                <button
                  onClick={openOptions}
                  className="inline-flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Configurações Avançadas</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Initialize the side panel
const container = document.getElementById('sidepanel-root');
if (container) {
  const root = createRoot(container);
  root.render(<SidePanel />);
}