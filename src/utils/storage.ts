import { UserSettings } from '../types';

const DEFAULT_SETTINGS: UserSettings = {
  selectedProvider: '',
  apiKey: '',
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