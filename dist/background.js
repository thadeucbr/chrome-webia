console.log("🚀 Background script iniciado");
const AI_PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI (ChatGPT)",
    defaultModels: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo-preview"]
  },
  {
    id: "gemini",
    name: "Google Gemini",
    defaultModels: ["gemini-1.5-flash", "gemini-1.5-pro"]
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    defaultModels: ["llama2", "codellama", "mistral"]
  }
];
class BackgroundService {
  constructor() {
    console.log("📋 BackgroundService inicializado");
    this.setupEventListeners();
  }
  setupEventListeners() {
    console.log("🔧 Configurando event listeners");
    chrome.runtime.onInstalled.addListener((details) => {
      console.log("📦 onInstalled triggered:", details.reason);
      if (details.reason === "install") {
        this.handleFirstInstall();
      } else if (details.reason === "update") {
        this.handleUpdate();
      }
    });
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("📨 Mensagem recebida:", message.type);
      this.handleMessage(message, sender, sendResponse);
      return true;
    });
    chrome.action.onClicked.addListener((tab) => {
      console.log("🖱️ Clique na extensão detectado, tab:", tab.id);
      this.handleActionClick(tab);
    });
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === "complete" && tab.url && !tab.url.startsWith("chrome://")) {
        this.ensureContentScriptInjected(tabId);
      }
    });
    console.log("✅ Event listeners configurados");
  }
  async ensureContentScriptInjected(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: "PING" });
      if (response?.success) {
        console.log("✅ Content script já ativo na aba:", tabId);
        return;
      }
    } catch (error) {
      console.log("🔄 Injetando content script na aba:", tabId);
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ["content.js"]
        });
        console.log("✅ Content script injetado com sucesso na aba:", tabId);
      } catch (injectError) {
        console.error("❌ Erro ao injetar content script:", injectError);
      }
    }
  }
  async handleFirstInstall() {
    console.log("🎉 Extensão instalada pela primeira vez");
    try {
      const currentWindow = await chrome.windows.getCurrent();
      console.log("🪟 Janela atual:", currentWindow.id);
      await chrome.sidePanel.open({ windowId: currentWindow.id });
      console.log("✅ Side panel aberto com sucesso");
    } catch (error) {
      console.error("❌ Erro ao abrir side panel:", error);
      await chrome.tabs.create({
        url: chrome.runtime.getURL("options.html")
      });
      console.log("🔄 Página de opções aberta como fallback");
    }
  }
  async handleUpdate() {
    console.log("🔄 Extensão atualizada");
    try {
      const result = await chrome.storage.sync.get("userSettings");
      if (result.userSettings) {
        console.log("⚙️ Configurações existentes encontradas");
      }
    } catch (error) {
      console.error("❌ Erro ao verificar configurações:", error);
    }
  }
  async handleActionClick(tab) {
    console.log("🎯 Processando clique na extensão");
    try {
      if (tab.windowId) {
        console.log("🪟 Abrindo side panel na janela:", tab.windowId);
        await chrome.sidePanel.open({ windowId: tab.windowId });
        console.log("✅ Side panel aberto com sucesso");
      } else {
        const currentWindow = await chrome.windows.getCurrent();
        console.log("🪟 Usando janela atual:", currentWindow.id);
        await chrome.sidePanel.open({ windowId: currentWindow.id });
        console.log("✅ Side panel aberto na janela atual");
      }
    } catch (error) {
      console.error("❌ Erro ao abrir side panel:", error);
      try {
        const result = await chrome.storage.sync.get("userSettings");
        const settings = result.userSettings;
        if (!settings?.isConfigured) {
          await chrome.tabs.create({
            url: chrome.runtime.getURL("options.html")
          });
          console.log("🔄 Página de opções aberta como fallback");
        } else {
          console.error("⚠️ Side panel não disponível. Verifique se o Chrome suporta side panels.");
          await chrome.tabs.create({
            url: chrome.runtime.getURL("options.html")
          });
        }
      } catch (configError) {
        console.error("❌ Erro ao verificar configurações:", configError);
        await chrome.tabs.create({
          url: chrome.runtime.getURL("options.html")
        });
      }
    }
  }
  async handleMessage(message, sender, sendResponse) {
    try {
      console.log("🔄 Processando mensagem:", message.type);
      switch (message.type) {
        case "GET_ACTIVE_TAB":
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          sendResponse({ tab: tabs[0] });
          break;
        case "EXECUTE_ON_TAB":
          await this.executeOnTab(message.tabId, message.action);
          sendResponse({ success: true });
          break;
        case "CHECK_PERMISSIONS":
          const hasPermissions = await this.checkPermissions(message.permissions);
          sendResponse({ hasPermissions });
          break;
        case "GET_MODELS":
          console.log("🔍 Solicitação de modelos para:", message.provider);
          const models = await this.getAvailableModels(message.provider, message.apiKey);
          console.log("📋 Modelos encontrados:", models.length);
          sendResponse({ models });
          break;
        case "INJECT_CONTENT_SCRIPT":
          await this.injectContentScript(message.tabId);
          sendResponse({ success: true });
          break;
        case "CONTENT_SCRIPT_READY":
          console.log("✅ Content script pronto na aba:", sender.tab?.id);
          sendResponse({ success: true });
          break;
        default:
          console.warn("⚠️ Tipo de mensagem não reconhecido:", message.type);
          sendResponse({ error: "Tipo de mensagem não reconhecido" });
      }
    } catch (error) {
      console.error("❌ Erro ao processar mensagem:", error);
      sendResponse({ error: error.message });
    }
  }
  async injectContentScript(tabId) {
    try {
      console.log("💉 Injetando content script na aba:", tabId);
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"]
      });
      console.log("✅ Content script injetado com sucesso");
    } catch (error) {
      console.error("❌ Erro ao injetar content script:", error);
      throw error;
    }
  }
  async executeOnTab(tabId, action) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: "EXECUTE_STEP",
        step: action
      });
    } catch (error) {
      console.error("❌ Erro ao executar ação na aba:", error);
      throw error;
    }
  }
  async checkPermissions(permissions) {
    try {
      return await chrome.permissions.contains({
        permissions
      });
    } catch (error) {
      console.error("❌ Erro ao verificar permissões:", error);
      return false;
    }
  }
  async getAvailableModels(provider, apiKey) {
    console.log("🔍 Buscando modelos para:", provider);
    try {
      switch (provider) {
        case "openai":
          return await this.getOpenAIModels(apiKey);
        case "gemini":
          return await this.getGeminiModels(apiKey);
        case "ollama":
          return await this.getOllamaModels(apiKey);
        default:
          console.log("📋 Usando modelos padrão para:", provider);
          return this.getDefaultModels(provider);
      }
    } catch (error) {
      console.error("❌ Erro ao buscar modelos:", error);
      console.log("🔄 Retornando modelos padrão");
      return this.getDefaultModels(provider);
    }
  }
  async getOpenAIModels(apiKey) {
    try {
      console.log("🤖 Buscando modelos OpenAI...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1e4);
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API OpenAI: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      const models = data.data.filter((model) => model.id.includes("gpt")).map((model) => model.id).sort();
      console.log("✅ Modelos OpenAI encontrados:", models.length);
      return models;
    } catch (error) {
      console.error("❌ Erro ao buscar modelos OpenAI:", error);
      return this.getDefaultModels("openai");
    }
  }
  async getGeminiModels(apiKey) {
    try {
      console.log("✨ Buscando modelos Gemini...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1e4);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API Gemini: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      if (!data.models || !Array.isArray(data.models)) {
        throw new Error("Resposta inválida da API Gemini");
      }
      const models = data.models.filter((model) => {
        return model.name && model.name.includes("gemini") && model.supportedGenerationMethods && model.supportedGenerationMethods.includes("generateContent");
      }).map((model) => model.name.split("/").pop()).filter((name) => name).sort();
      console.log("✅ Modelos Gemini encontrados:", models.length);
      return models.length > 0 ? models : this.getDefaultModels("gemini");
    } catch (error) {
      console.error("❌ Erro ao buscar modelos Gemini:", error);
      return this.getDefaultModels("gemini");
    }
  }
  async getOllamaModels(baseUrl) {
    try {
      console.log("🏠 Buscando modelos Ollama...");
      const url = baseUrl.endsWith("/") ? `${baseUrl}api/tags` : `${baseUrl}/api/tags`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1e4);
      const response = await fetch(url, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Erro no Ollama: ${response.status} - ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.models || !Array.isArray(data.models)) {
        throw new Error("Resposta inválida do Ollama");
      }
      const models = data.models.map((model) => model.name).filter((name) => name).sort();
      console.log("✅ Modelos Ollama encontrados:", models.length);
      return models;
    } catch (error) {
      console.error("❌ Erro ao buscar modelos Ollama:", error);
      return this.getDefaultModels("ollama");
    }
  }
  getDefaultModels(provider) {
    const providerData = AI_PROVIDERS.find((p) => p.id === provider);
    const models = providerData?.defaultModels || [];
    console.log("📋 Modelos padrão para", provider, ":", models);
    return models;
  }
  // Método para limpar dados antigos
  async cleanupOldData() {
    try {
      console.log("🧹 Iniciando limpeza de dados antigos...");
      const result = await chrome.storage.local.get();
      const now = Date.now();
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1e3;
      const keysToRemove = [];
      Object.entries(result).forEach(([key, value]) => {
        if (typeof value === "object" && value && "timestamp" in value && value.timestamp < oneWeekAgo) {
          keysToRemove.push(key);
        }
      });
      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
        console.log(`🧹 Limpeza concluída: ${keysToRemove.length} itens removidos`);
      } else {
        console.log("🧹 Nenhum item antigo encontrado para limpeza");
      }
    } catch (error) {
      console.error("❌ Erro na limpeza de dados:", error);
    }
  }
}
console.log("🏗️ Criando instância do BackgroundService");
const backgroundService = new BackgroundService();
chrome.alarms.create("cleanup", { periodInMinutes: 24 * 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cleanup") {
    backgroundService.cleanupOldData();
  }
});
console.log("🎯 Background script configurado completamente");
