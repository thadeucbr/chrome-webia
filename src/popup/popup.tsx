import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Settings, Sparkles, AlertCircle, Loader } from 'lucide-react';
import OnboardingFlow from '../components/OnboardingFlow';
import TaskExecutor from '../components/TaskExecutor';
import { getSettings } from '../utils/storage';
import { aiService } from '../utils/aiService';
import { UserSettings, AIResponse } from '../types';

const Popup: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [instruction, setInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTask, setCurrentTask] = useState<AIResponse | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

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
      <OnboardingFlow
        onComplete={() => {
          setShowOnboarding(false);
          loadSettings();
        }}
      />
    );
  }

  if (!settings?.isConfigured) {
    return (
      <div className="p-6 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
        <h2 className="text-lg font-semibold text-gray-800">
          Configuração Necessária
        </h2>
        <p className="text-sm text-gray-600">
          Configure sua IA antes de usar a extensão
        </p>
        <button
          onClick={openOptions}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Abrir Configurações
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white">
      <AnimatePresence mode="wait">
        {currentTask ? (
          <motion.div
            key="task-executor"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4"
          >
            <TaskExecutor
              steps={currentTask.steps}
              onComplete={handleTaskComplete}
              onCancel={handleTaskCancel}
            />
          </motion.div>
        ) : (
          <motion.div
            key="main-interface"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <h1 className="text-lg font-semibold text-gray-800">
                  Assistente IA
                </h1>
              </div>
              <button
                onClick={openOptions}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Examples */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Exemplos rápidos:</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  'Abra o Gmail e verifique novos emails',
                  'Faça uma postagem no LinkedIn',
                  'Consulte o clima para hoje'
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setInstruction(example)}
                    className="text-left text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Instruction Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                O que você quer que eu faça?
              </label>
              <div className="relative">
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Ex: Faça uma postagem de bom dia no meu LinkedIn"
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
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
                  className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 mb-2">💡 Dicas:</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Seja específico sobre o que quer fazer</li>
                <li>• Mencione o site se necessário (ex: "no LinkedIn")</li>
                <li>• Use linguagem natural e simples</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Initialize the popup
const container = document.getElementById('popup-root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}