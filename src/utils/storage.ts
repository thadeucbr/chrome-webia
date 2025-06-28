import { UserSettings } from '../types';

const DEFAULT_SETTINGS: UserSettings = {
  selectedProvider: '',
  apiKey: '',
  selectedModel: '',
  isConfigured: false,
  hasCompletedOnboarding: false
};

export const getSettings = async (): Promise<UserSettings> => {
  try {
    const result = await chrome.storage.sync.get('userSettings');
    return { ...DEFAULT_SETTINGS, ...result.userSettings };
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: Partial<UserSettings>): Promise<void> => {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await chrome.storage.sync.set({ userSettings: updatedSettings });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    throw error;
  }
};

export const clearSettings = async (): Promise<void> => {
  try {
    await chrome.storage.sync.remove('userSettings');
  } catch (error) {
    console.error('Erro ao limpar configurações:', error);
    throw error;
  }
};

export const getAvailableModels = async (provider: string, apiKey: string): Promise<string[]> => {
  try {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout ao buscar modelos'));
      }, 10000); // 10 segundos de timeout

      chrome.runtime.sendMessage(
        { type: 'GET_MODELS', provider, apiKey },
        (response) => {
          clearTimeout(timeout);
          
          if (chrome.runtime.lastError) {
            console.error('Erro na comunicação:', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          
          if (response && response.models && Array.isArray(response.models)) {
            resolve(response.models);
          } else {
            // Usar modelos padrão em caso de erro
            const defaultModels = getDefaultModels(provider);
            resolve(defaultModels);
          }
        }
      );
    });
  } catch (error) {
    console.error('Erro ao buscar modelos:', error);
    return getDefaultModels(provider);
  }
};

const getDefaultModels = (provider: string): string[] => {
  switch (provider) {
    case 'openai':
      return ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'];
    case 'gemini':
      return ['gemini-pro', 'gemini-pro-vision'];
    case 'ollama':
      return ['llama2', 'codellama', 'mistral'];
    default:
      return [];
  }
};