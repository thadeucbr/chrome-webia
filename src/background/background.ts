// Service Worker para a extensão - Versão compatível
console.log('🚀 Background script iniciado');

// Definir tipos básicos para evitar problemas de importação
interface UserSettings {
  selectedProvider: string;
  apiKey: string;
  selectedModel: string;
  isConfigured: boolean;
  hasCompletedOnboarding: boolean;
}

interface AIProvider {
  id: string;
  name: string;
  defaultModels: string[];
}

// Provedores de IA inline para evitar imports
const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    defaultModels: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview']
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    defaultModels: ['gemini-pro', 'gemini-pro-vision']
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    defaultModels: ['llama2', 'codellama', 'mistral']
  }
];

class BackgroundService {
  constructor() {
    console.log('📋 BackgroundService inicializado');
    this.setupEventListeners();
  }

  private setupEventListeners() {
    console.log('🔧 Configurando event listeners');
    
    // Listener para instalação da extensão
    chrome.runtime.onInstalled.addListener((details) => {
      console.log('📦 onInstalled triggered:', details.reason);
      if (details.reason === 'install') {
        this.handleFirstInstall();
      } else if (details.reason === 'update') {
        this.handleUpdate();
      }
    });

    // Listener para mensagens de outros scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('📨 Mensagem recebida:', message.type);
      this.handleMessage(message, sender, sendResponse);
      return true; // Indica resposta assíncrona
    });

    // Listener para cliques na ação da extensão
    chrome.action.onClicked.addListener((tab) => {
      console.log('🖱️ Clique na extensão detectado, tab:', tab.id);
      this.handleActionClick(tab);
    });

    console.log('✅ Event listeners configurados');
  }

  private async handleFirstInstall() {
    console.log('🎉 Extensão instalada pela primeira vez');
    
    try {
      // Tentar abrir side panel
      const currentWindow = await chrome.windows.getCurrent();
      console.log('🪟 Janela atual:', currentWindow.id);
      await chrome.sidePanel.open({ windowId: currentWindow.id });
      console.log('✅ Side panel aberto com sucesso');
    } catch (error) {
      console.error('❌ Erro ao abrir side panel:', error);
      // Fallback para página de opções
      await chrome.tabs.create({
        url: chrome.runtime.getURL('options.html')
      });
      console.log('🔄 Página de opções aberta como fallback');
    }
  }

  private async handleUpdate() {
    console.log('🔄 Extensão atualizada');
    
    // Verificar se precisa migrar configurações
    try {
      const result = await chrome.storage.sync.get('userSettings');
      if (result.userSettings) {
        console.log('⚙️ Configurações existentes encontradas');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar configurações:', error);
    }
  }

  private async handleActionClick(tab: chrome.tabs.Tab) {
    console.log('🎯 Processando clique na extensão');
    
    try {
      // Tentar abrir side panel
      if (tab.windowId) {
        console.log('🪟 Abrindo side panel na janela:', tab.windowId);
        await chrome.sidePanel.open({ windowId: tab.windowId });
        console.log('✅ Side panel aberto com sucesso');
      } else {
        // Se não tiver windowId, usar janela atual
        const currentWindow = await chrome.windows.getCurrent();
        console.log('🪟 Usando janela atual:', currentWindow.id);
        await chrome.sidePanel.open({ windowId: currentWindow.id });
        console.log('✅ Side panel aberto na janela atual');
      }
    } catch (error) {
      console.error('❌ Erro ao abrir side panel:', error);
      
      // Fallback: verificar se a extensão está configurada
      try {
        const result = await chrome.storage.sync.get('userSettings');
        const settings = result.userSettings as UserSettings;

        if (!settings?.isConfigured) {
          // Abrir página de configurações se não estiver configurado
          await chrome.tabs.create({
            url: chrome.runtime.getURL('options.html')
          });
          console.log('🔄 Página de opções aberta como fallback');
        } else {
          // Se estiver configurado, mostrar erro
          console.error('⚠️ Side panel não disponível. Verifique se o Chrome suporta side panels.');
          // Tentar abrir página de opções mesmo assim
          await chrome.tabs.create({
            url: chrome.runtime.getURL('options.html')
          });
        }
      } catch (configError) {
        console.error('❌ Erro ao verificar configurações:', configError);
        // Último recurso: abrir página de opções
        await chrome.tabs.create({
          url: chrome.runtime.getURL('options.html')
        });
      }
    }
  }

  private async handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
    try {
      console.log('🔄 Processando mensagem:', message.type);
      
      switch (message.type) {
        case 'GET_ACTIVE_TAB':
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          sendResponse({ tab: tabs[0] });
          break;

        case 'EXECUTE_ON_TAB':
          await this.executeOnTab(message.tabId, message.action);
          sendResponse({ success: true });
          break;

        case 'CHECK_PERMISSIONS':
          const hasPermissions = await this.checkPermissions(message.permissions);
          sendResponse({ hasPermissions });
          break;

        case 'GET_MODELS':
          const models = await this.getAvailableModels(message.provider, message.apiKey);
          sendResponse({ models });
          break;

        default:
          console.warn('⚠️ Tipo de mensagem não reconhecido:', message.type);
          sendResponse({ error: 'Tipo de mensagem não reconhecido' });
      }
    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      sendResponse({ error: (error as Error).message });
    }
  }

  private async executeOnTab(tabId: number, action: any) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'EXECUTE_STEP',
        step: action
      });
    } catch (error) {
      console.error('❌ Erro ao executar ação na aba:', error);
      throw error;
    }
  }

  private async checkPermissions(permissions: string[]): Promise<boolean> {
    try {
      return await chrome.permissions.contains({
        permissions: permissions
      });
    } catch (error) {
      console.error('❌ Erro ao verificar permissões:', error);
      return false;
    }
  }

  private async getAvailableModels(provider: string, apiKey: string): Promise<string[]> {
    console.log('🔍 Buscando modelos para:', provider);
    
    try {
      switch (provider) {
        case 'openai':
          return await this.getOpenAIModels(apiKey);
        case 'gemini':
          return await this.getGeminiModels(apiKey);
        case 'ollama':
          return await this.getOllamaModels(apiKey);
        default:
          return this.getDefaultModels(provider);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar modelos:', error);
      return this.getDefaultModels(provider);
    }
  }

  private async getOpenAIModels(apiKey: string): Promise<string[]> {
    try {
      console.log('🤖 Buscando modelos OpenAI...');
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API OpenAI: ${response.statusText}`);
      }

      const data = await response.json();
      const models = data.data
        .filter((model: any) => model.id.includes('gpt'))
        .map((model: any) => model.id)
        .sort();
      
      console.log('✅ Modelos OpenAI encontrados:', models.length);
      return models;
    } catch (error) {
      console.error('❌ Erro ao buscar modelos OpenAI:', error);
      return this.getDefaultModels('openai');
    }
  }

  private async getGeminiModels(apiKey: string): Promise<string[]> {
    try {
      console.log('✨ Buscando modelos Gemini...');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

      if (!response.ok) {
        throw new Error(`Erro na API Gemini: ${response.statusText}`);
      }

      const data = await response.json();
      const models = data.models
        .filter((model: any) => model.name.includes('gemini'))
        .map((model: any) => model.name.split('/').pop())
        .sort();
      
      console.log('✅ Modelos Gemini encontrados:', models.length);
      return models;
    } catch (error) {
      console.error('❌ Erro ao buscar modelos Gemini:', error);
      return this.getDefaultModels('gemini');
    }
  }

  private async getOllamaModels(baseUrl: string): Promise<string[]> {
    try {
      console.log('🏠 Buscando modelos Ollama...');
      const response = await fetch(`${baseUrl}/api/tags`);

      if (!response.ok) {
        throw new Error(`Erro no Ollama: ${response.statusText}`);
      }

      const data = await response.json();
      const models = data.models.map((model: any) => model.name).sort();
      
      console.log('✅ Modelos Ollama encontrados:', models.length);
      return models;
    } catch (error) {
      console.error('❌ Erro ao buscar modelos Ollama:', error);
      return this.getDefaultModels('ollama');
    }
  }

  private getDefaultModels(provider: string): string[] {
    const providerData = AI_PROVIDERS.find(p => p.id === provider);
    return providerData?.defaultModels || [];
  }

  // Método para limpar dados antigos (executado periodicamente)
  private async cleanupOldData() {
    try {
      const result = await chrome.storage.local.get();
      const now = Date.now();
      const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

      const keysToRemove: string[] = [];
      
      Object.entries(result).forEach(([key, value]) => {
        if (typeof value === 'object' && value && 'timestamp' in value && (value as any).timestamp < oneWeekAgo) {
          keysToRemove.push(key);
        }
      });

      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        console.log(`🧹 Limpeza concluída: ${keysToRemove.length} itens removidos`);
      }
    } catch (error) {
      console.error('❌ Erro na limpeza de dados:', error);
    }
  }
}

// Inicializar o serviço de background
console.log('🏗️ Criando instância do BackgroundService');
const backgroundService = new BackgroundService();

// Executar limpeza de dados uma vez por dia
chrome.alarms.create('cleanup', { periodInMinutes: 24 * 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    (backgroundService as any).cleanupOldData();
  }
});

console.log('🎯 Background script configurado completamente');