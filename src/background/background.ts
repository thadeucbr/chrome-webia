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
    chrome.tabs.create({
      url: chrome.runtime.getURL('options.html')
    });
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
        chrome.tabs.create({
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
new BackgroundService();

// Executar limpeza de dados uma vez por dia
chrome.alarms.create('cleanup', { periodInMinutes: 24 * 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    new BackgroundService()['cleanupOldData']();
  }
});