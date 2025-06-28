// Service Worker para a extensão
class BackgroundService {
  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listener para instalação da extensão
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.handleFirstInstall();
      } else if (details.reason === 'update') {
        this.handleUpdate();
      }
    });

    // Listener para mensagens de outros scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Indica resposta assíncrona
    });

    // Listener para cliques na ação da extensão
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });
  }

  private async handleFirstInstall() {
    console.log('Extensão instalada pela primeira vez');
    
    // Abrir página de boas-vindas
    try {
      await chrome.tabs.create({
        url: chrome.runtime.getURL('options.html')
      });
    } catch (error) {
      console.error('Erro ao abrir página de opções:', error);
    }
  }

  private async handleUpdate() {
    console.log('Extensão atualizada');
    
    // Verificar se precisa migrar configurações
    try {
      const result = await chrome.storage.sync.get('userSettings');
      if (result.userSettings) {
        console.log('Configurações existentes encontradas');
      }
    } catch (error) {
      console.error('Erro ao verificar configurações:', error);
    }
  }

  private async handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
    try {
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
          sendResponse({ error: 'Tipo de mensagem não reconhecido' });
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      sendResponse({ error: error.message });
    }
  }

  private async handleActionClick(tab: chrome.tabs.Tab) {
    // Verificar se a extensão está configurada
    try {
      const result = await chrome.storage.sync.get('userSettings');
      const settings = result.userSettings;

      if (!settings?.isConfigured) {
        // Abrir página de configurações se não estiver configurado
        await chrome.tabs.create({
          url: chrome.runtime.getURL('options.html')
        });
      }
    } catch (error) {
      console.error('Erro ao verificar configurações:', error);
    }
  }

  private async executeOnTab(tabId: number, action: any) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'EXECUTE_STEP',
        step: action
      });
    } catch (error) {
      console.error('Erro ao executar ação na aba:', error);
      throw error;
    }
  }

  private async checkPermissions(permissions: string[]): Promise<boolean> {
    try {
      return await chrome.permissions.contains({
        permissions: permissions
      });
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  }

  private async getAvailableModels(provider: string, apiKey: string): Promise<string[]> {
    try {
      switch (provider) {
        case 'openai':
          return await this.getOpenAIModels(apiKey);
        case 'gemini':
          return await this.getGeminiModels(apiKey);
        case 'ollama':
          return await this.getOllamaModels(apiKey);
        default:
          return [];
      }
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
      return [];
    }
  }

  private async getOpenAIModels(apiKey: string): Promise<string[]> {
    try {
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
      return data.data
        .filter((model: any) => model.id.includes('gpt'))
        .map((model: any) => model.id)
        .sort();
    } catch (error) {
      console.error('Erro ao buscar modelos OpenAI:', error);
      return ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview']; // Fallback
    }
  }

  private async getGeminiModels(apiKey: string): Promise<string[]> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

      if (!response.ok) {
        throw new Error(`Erro na API Gemini: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models
        .filter((model: any) => model.name.includes('gemini'))
        .map((model: any) => model.name.split('/').pop())
        .sort();
    } catch (error) {
      console.error('Erro ao buscar modelos Gemini:', error);
      return ['gemini-pro', 'gemini-pro-vision']; // Fallback
    }
  }

  private async getOllamaModels(baseUrl: string): Promise<string[]> {
    try {
      const response = await fetch(`${baseUrl}/api/tags`);

      if (!response.ok) {
        throw new Error(`Erro no Ollama: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models.map((model: any) => model.name).sort();
    } catch (error) {
      console.error('Erro ao buscar modelos Ollama:', error);
      return ['llama2', 'codellama', 'mistral']; // Fallback
    }
  }

  // Método para limpar dados antigos (executado periodicamente)
  private async cleanupOldData() {
    try {
      const result = await chrome.storage.local.get();
      const now = Date.now();
      const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

      const keysToRemove: string[] = [];
      
      Object.entries(result).forEach(([key, value]) => {
        if (typeof value === 'object' && value.timestamp && value.timestamp < oneWeekAgo) {
          keysToRemove.push(key);
        }
      });

      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        console.log(`Limpeza concluída: ${keysToRemove.length} itens removidos`);
      }
    } catch (error) {
      console.error('Erro na limpeza de dados:', error);
    }
  }
}

// Inicializar o serviço de background
const backgroundService = new BackgroundService();

// Executar limpeza de dados uma vez por dia
chrome.alarms.create('cleanup', { periodInMinutes: 24 * 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    backgroundService['cleanupOldData']();
  }
});