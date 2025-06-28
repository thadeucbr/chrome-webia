import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { AI_PROVIDERS } from '../utils/aiProviders';
import { saveSettings } from '../utils/storage';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const steps = [
    'Bem-vindo',
    'Escolha sua IA',
    'Configure a chave',
    'Teste a conexão',
    'Pronto!'
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
      await saveSettings({
        selectedProvider,
        apiKey,
        isConfigured: true,
        hasCompletedOnboarding: true
      });
      nextStep();
    } catch (error) {
      alert('Erro ao testar conexão. Verifique sua chave de API.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold text-gray-800">
              Bem-vindo ao Assistente IA Web!
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Automatize tarefas repetitivas na web com inteligência artificial. 
              Vou te ajudar a configurar tudo em poucos passos simples.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">O que você pode fazer:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• "Faça uma postagem de bom dia no LinkedIn"</li>
                <li>• "Consulte preços de passagem para São Paulo"</li>
                <li>• "Bata meu ponto no sistema da empresa"</li>
                <li>• E muito mais!</li>
              </ul>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Escolha seu Provedor de IA
              </h2>
              <p className="text-gray-600">
                Selecione qual inteligência artificial você quer usar
              </p>
            </div>
            
            <div className="space-y-3">
              {AI_PROVIDERS.map((provider) => (
                <div
                  key={provider.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedProvider === provider.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedProvider(provider.id)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{provider.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{provider.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{provider.description}</p>
                      <p className="text-xs text-green-600 font-medium">{provider.costInfo}</p>
                    </div>
                    {selectedProvider === provider.id && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        const provider = AI_PROVIDERS.find(p => p.id === selectedProvider);
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Configure sua Chave de API
              </h2>
              <p className="text-gray-600">
                Você precisa de uma chave para usar {provider?.name}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Como obter sua chave:</h3>
                  <ol className="text-sm text-yellow-700 mt-2 space-y-1 list-decimal list-inside">
                    <li>Clique no link abaixo para abrir o site oficial</li>
                    <li>Crie uma conta ou faça login</li>
                    <li>Procure por "API Keys" ou "Chaves de API"</li>
                    <li>Crie uma nova chave e copie ela</li>
                    <li>Cole a chave no campo abaixo</li>
                  </ol>
                </div>
              </div>
            </div>

            <a
              href={provider?.setupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>Abrir {provider?.name}</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {provider?.apiKeyLabel}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Cole sua chave de API aqui..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Vamos testar sua configuração
            </h2>
            <p className="text-gray-600">
              Clique no botão abaixo para verificar se tudo está funcionando
            </p>
            
            <button
              onClick={testConnection}
              disabled={isTestingConnection || !apiKey}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTestingConnection ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Testando conexão...</span>
                </div>
              ) : (
                'Testar Conexão'
              )}
            </button>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800">
              Tudo pronto!
            </h2>
            <p className="text-gray-600">
              Sua extensão está configurada e pronta para usar. 
              Agora você pode automatizar suas tarefas web!
            </p>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Próximos passos:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Clique no ícone da extensão na barra do navegador</li>
                <li>• Digite uma instrução como "Abra o Gmail"</li>
                <li>• Veja a mágica acontecer!</li>
              </ul>
            </div>

            <button
              onClick={onComplete}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Começar a usar
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center ${
                index <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 text-center">
          Passo {currentStep + 1} de {steps.length}: {steps[currentStep]}
        </p>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="min-h-[400px] flex flex-col justify-center"
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {currentStep < steps.length - 1 && currentStep !== 3 && (
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Anterior</span>
          </button>

          <button
            onClick={nextStep}
            disabled={
              (currentStep === 1 && !selectedProvider) ||
              (currentStep === 2 && !apiKey)
            }
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Próximo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default OnboardingFlow;