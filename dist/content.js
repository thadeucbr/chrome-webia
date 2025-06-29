console.log("🔧 Content script carregado em:", window.location.href);
class WebAutomator {
  constructor() {
    this.isExecuting = false;
    this.isReady = false;
    this.init();
  }
  async init() {
    console.log("🚀 Inicializando WebAutomator...");
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setup());
    } else {
      this.setup();
    }
  }
  setup() {
    console.log("🔧 Configurando WebAutomator...");
    this.setupMessageListener();
    this.injectStyles();
    this.isReady = true;
    console.log("✅ WebAutomator pronto!");
    this.notifyReady();
  }
  notifyReady() {
    try {
      chrome.runtime.sendMessage({
        type: "CONTENT_SCRIPT_READY",
        url: window.location.href,
        timestamp: Date.now()
      });
      console.log("📡 Notificação de prontidão enviada");
    } catch (error) {
      console.log("⚠️ Não foi possível notificar background script:", error);
    }
  }
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("📨 Mensagem recebida:", message.type, message);
      if (message.type === "EXECUTE_STEP") {
        if (!this.isReady) {
          console.log("❌ Content script não está pronto");
          sendResponse({ success: false, error: "Content script não está pronto" });
          return;
        }
        console.log("🎯 Executando passo:", message.step);
        this.executeStep(message.step).then(() => {
          console.log("✅ Passo executado com sucesso");
          sendResponse({ success: true });
        }).catch((error) => {
          console.error("❌ Erro ao executar passo:", error);
          sendResponse({ success: false, error: error.message });
        });
        return true;
      }
      if (message.type === "PING") {
        console.log("🏓 PING recebido, respondendo PONG");
        sendResponse({
          success: true,
          ready: this.isReady,
          url: window.location.href,
          timestamp: Date.now()
        });
        return;
      }
      console.log("⚠️ Tipo de mensagem não reconhecido:", message.type);
    });
    console.log("👂 Message listener configurado");
  }
  injectStyles() {
    if (document.getElementById("ai-assistant-styles")) {
      console.log("🎨 Estilos já injetados");
      return;
    }
    const style = document.createElement("style");
    style.id = "ai-assistant-styles";
    style.textContent = `
      .ai-assistant-highlight {
        outline: 3px solid #3b82f6 !important;
        outline-offset: 2px !important;
        background-color: rgba(59, 130, 246, 0.1) !important;
        transition: all 0.3s ease !important;
        box-shadow: 0 0 10px rgba(59, 130, 246, 0.5) !important;
      }
      
      .ai-assistant-executing {
        position: relative !important;
      }
      
      .ai-assistant-executing::after {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 3px solid #3b82f6;
        border-radius: 6px;
        animation: ai-pulse 1s infinite;
        pointer-events: none;
        z-index: 10000;
      }
      
      @keyframes ai-pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.02); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      .ai-assistant-tooltip {
        position: fixed;
        background: #1f2937;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        z-index: 10001;
        pointer-events: none;
        white-space: nowrap;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border: 1px solid #3b82f6;
      }
      
      .ai-assistant-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: #1f2937;
      }
    `;
    const target = document.head || document.documentElement || document.body;
    if (target) {
      target.appendChild(style);
      console.log("🎨 Estilos injetados com sucesso");
    } else {
      console.log("⚠️ Não foi possível injetar estilos");
    }
  }
  async executeStep(step) {
    console.log("🎯 Iniciando execução do passo:", step);
    if (this.isExecuting) {
      throw new Error("Já existe uma execução em andamento");
    }
    this.isExecuting = true;
    try {
      switch (step.action) {
        case "navigate":
          await this.navigate(step.target);
          break;
        case "click":
          await this.clickElement(step.target);
          break;
        case "type":
          await this.typeText(step.target, step.value);
          break;
        case "wait":
          await this.wait(step.value ? parseInt(step.value) : 1e3);
          break;
        case "scroll":
          await this.scroll(step.target);
          break;
        default:
          throw new Error(`Ação não suportada: ${step.action}`);
      }
      console.log("✅ Passo executado com sucesso:", step.action);
    } catch (error) {
      console.error("❌ Erro na execução do passo:", error);
      throw error;
    } finally {
      this.isExecuting = false;
    }
  }
  async navigate(url) {
    console.log("🌐 Navegando para:", url);
    return new Promise((resolve, reject) => {
      try {
        if (window.location.href === url) {
          console.log("✅ Já estamos na página correta");
          resolve();
          return;
        }
        console.log("🔄 Redirecionando para:", url);
        window.location.href = url;
        setTimeout(() => {
          console.log("✅ Navegação concluída");
          resolve();
        }, 3e3);
      } catch (error) {
        console.error("❌ Erro ao navegar:", error);
        reject(new Error(`Erro ao navegar: ${error.message}`));
      }
    });
  }
  async clickElement(selector) {
    console.log("🖱️ Tentando clicar em:", selector);
    const element = await this.findElementWithRetry(selector, 1e4);
    if (!element) {
      throw new Error(`Elemento não encontrado: ${selector}`);
    }
    console.log("✅ Elemento encontrado:", element);
    this.highlightElement(element);
    await this.wait(800);
    console.log("📜 Fazendo scroll para o elemento...");
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center"
    });
    await this.wait(1e3);
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    console.log(`🎯 Clicando nas coordenadas: (${x}, ${y})`);
    const events = ["mousedown", "mouseup", "click"];
    for (const eventType of events) {
      const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        button: 0
      });
      element.dispatchEvent(event);
      await this.wait(100);
    }
    if (element instanceof HTMLElement) {
      console.log("🖱️ Executando click() nativo...");
      element.click();
    }
    if (element instanceof HTMLElement && "focus" in element) {
      try {
        element.focus();
      } catch (e) {
      }
    }
    this.removeHighlight(element);
    await this.wait(500);
    console.log("✅ Clique executado com sucesso");
  }
  async typeText(selector, text) {
    console.log("⌨️ Tentando digitar em:", selector, "texto:", text);
    const element = await this.findElementWithRetry(selector, 1e4);
    if (!element) {
      throw new Error(`Campo de texto não encontrado: ${selector}`);
    }
    console.log("✅ Campo encontrado:", element);
    this.highlightElement(element);
    console.log("🎯 Focando no elemento...");
    element.focus();
    await this.wait(500);
    console.log("🧹 Limpando campo...");
    element.value = "";
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    await this.wait(300);
    console.log("⌨️ Digitando texto...");
    for (let i = 0; i < text.length; i++) {
      element.value += text[i];
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new KeyboardEvent("keydown", {
        key: text[i],
        bubbles: true
      }));
      element.dispatchEvent(new KeyboardEvent("keyup", {
        key: text[i],
        bubbles: true
      }));
      await this.wait(80 + Math.random() * 120);
    }
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
    this.removeHighlight(element);
    console.log("✅ Texto digitado com sucesso");
  }
  async scroll(direction) {
    console.log("📜 Fazendo scroll:", direction);
    const scrollAmount = 400;
    const currentScroll = window.pageYOffset;
    let targetScroll;
    switch (direction.toLowerCase()) {
      case "up":
        targetScroll = Math.max(0, currentScroll - scrollAmount);
        break;
      case "down":
        targetScroll = currentScroll + scrollAmount;
        break;
      case "top":
        targetScroll = 0;
        break;
      case "bottom":
        targetScroll = document.body.scrollHeight;
        break;
      default:
        targetScroll = parseInt(direction) || currentScroll;
    }
    console.log(`📜 Scroll de ${currentScroll} para ${targetScroll}`);
    window.scrollTo({
      top: targetScroll,
      behavior: "smooth"
    });
    await this.wait(1500);
    console.log("✅ Scroll executado");
  }
  async findElementWithRetry(selector, timeout = 1e4) {
    console.log(`🔍 Procurando elemento "${selector}" com timeout de ${timeout}ms...`);
    const startTime = Date.now();
    let attempts = 0;
    while (Date.now() - startTime < timeout) {
      attempts++;
      console.log(`🔍 Tentativa ${attempts} de encontrar: ${selector}`);
      const element = this.findElement(selector);
      if (element) {
        console.log(`✅ Elemento encontrado na tentativa ${attempts}:`, element);
        return element;
      }
      await this.wait(500);
    }
    console.log(`❌ Elemento não encontrado após ${attempts} tentativas: ${selector}`);
    return null;
  }
  findElement(selector) {
    const strategies = [
      () => document.querySelector(selector),
      () => document.querySelector(`[data-testid="${selector}"]`),
      () => document.querySelector(`[aria-label="${selector}"]`),
      () => document.querySelector(`[placeholder="${selector}"]`),
      () => document.querySelector(`[title="${selector}"]`),
      () => document.querySelector(`[alt="${selector}"]`),
      () => this.findByText(selector),
      () => this.findByPartialText(selector),
      () => this.findByRole(selector)
    ];
    for (let i = 0; i < strategies.length; i++) {
      try {
        const element = strategies[i]();
        if (element && this.isElementVisible(element)) {
          console.log(`✅ Elemento encontrado com estratégia ${i + 1}:`, element);
          return element;
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  }
  findByText(text) {
    const xpath = `//*[normalize-space(text())="${text}"]`;
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue;
  }
  findByPartialText(text) {
    const xpath = `//*[contains(normalize-space(text()), "${text}")]`;
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue;
  }
  findByRole(role) {
    return document.querySelector(`[role="${role}"]`);
  }
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const isVisible = rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none" && style.opacity !== "0";
    if (!isVisible) {
      console.log("❌ Elemento não visível:", {
        width: rect.width,
        height: rect.height,
        visibility: style.visibility,
        display: style.display,
        opacity: style.opacity
      });
    }
    return isVisible;
  }
  highlightElement(element) {
    console.log("🎨 Destacando elemento...");
    element.classList.add("ai-assistant-highlight", "ai-assistant-executing");
    const tooltip = document.createElement("div");
    tooltip.className = "ai-assistant-tooltip";
    tooltip.textContent = "🤖 Executando ação...";
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 50}px`;
    document.body.appendChild(tooltip);
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    }, 3e3);
  }
  removeHighlight(element) {
    console.log("🎨 Removendo destaque...");
    element.classList.remove("ai-assistant-highlight", "ai-assistant-executing");
  }
  async wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
console.log("🚀 Criando instância do WebAutomator...");
const automator = new WebAutomator();
window.webAutomator = automator;
console.log("🔧 WebAutomator disponível globalmente como window.webAutomator");
