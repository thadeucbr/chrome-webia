import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion } from 'framer-motion';
import { Save, Trash2, TestTube, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { AI_PROVIDERS, getProviderById } from '../utils/aiProviders';
import { getSettings, saveSettings, clearSettings } from '../utils/storage';
import { UserSettings } from '../types';

const Options: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    selectedProvider: '',
    apiKey: '',
    isConfigured: false,
    hasCompletedOnboarding: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const userSettings = await getSettings();
      setSettings(userSettings);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveSettings({
        ...settings,
        isConfigured: !!(settings.selectedProvider && settings.apiKey)
      });
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      alert('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestResult('success');
    } catch (error) {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleReset = async () => {
    if (confirm('Tem certeza que deseja limpar todas as configurações?')) {
      try {
        await clearSettings();
        setSettings({
          selectedProvider: '',
          apiKey: '',
          isConfigured: false,
          hasCompletedOnboarding: false
        });
        alert('Configurações limpas com sucesso!');
      } catch (error) {
        alert('Erro ao limpar configurações');
      }
    }
  };

  const selectedProviderData = getProviderById(settings.selectedProvider);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Configurações do Assistente IA
            </h1>
            <p className="text-gray-600 mt-1">
              Configure sua inteligência artificial para automatizar tarefas web
            </p>
          </div>

          <div className="p-6 space-y-8">
            {/* Provider Selection */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Provedor de IA
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {AI_PROVIDERS.map((provider) => (
                  <div
                    key={provider.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      settings.selectedProvider === provider.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSettings({ ...settings, selectedProvider: provider.id })}
                  >
                    <div className="text-center space-y-2">
                      <span className="text-3xl">{provider.icon}</span>
                      <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                      <p className="text-sm text-gray-600">{provider.description}</p>
                      <p className="text-xs text-green-600 font-medium">{provider.costInfo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* API Key Configuration */}
            {settings.selectedProvider && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  Configuração da API
                </h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{selectedProviderData?.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900">
                        {selectedProviderData?.name}
                      </h3>
                      <p className="text-sm text-blue-800 mb-3">
                        {selectedProviderData?.description}
                      </p>
                      <a
                        href={selectedProviderData?.setupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <span>Obter chave de API</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {selectedProviderData?.apiKeyLabel}
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.apiKey}
                      onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                      placeholder="Cole sua chave de API aqui..."
                      className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      {showApiKey ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </div>

                {/* Test Connection */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleTest}
                    disabled={!settings.apiKey || isTesting}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isTesting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Testando...</span>
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4" />
                        <span>Testar Conexão</span>
                      </>
                    )}
                  </button>

                  {testResult === 'success' && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Conexão bem-sucedida!</span>
                    </div>
                  )}

                  {testResult === 'error' && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">Erro na conexão</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Usage Tips */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">💡 Dicas de Uso</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Mantenha sua chave de API segura e não a compartilhe</li>
                <li>• Monitore o uso para evitar custos inesperados</li>
                <li>• Use instruções claras e específicas para melhores resultados</li>
                <li>• A extensão funciona melhor em sites em português</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <button
                onClick={handleReset}
                className="flex items-center space-x-2 text-red-600 hover:text-red-800 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpar Configurações</span>
              </button>

              <button
                onClick={handleSave}
                disabled={!settings.selectedProvider || !settings.apiKey || isSaving}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Configurações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Initialize the options page
const container = document.getElementById('options-root');
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
}