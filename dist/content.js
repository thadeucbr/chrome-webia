console.log("🔧 Content script carregado em:", window.location.href);
class WebAutomator {
  constructor() {
    this.isExecuting = false;
    this.isReady = false;
    this.init();
  }
  async init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setup());
    } else {
      this.setup();
    }
  }
  setup() {
    console.log("🚀 WebAutomator inicializado");
    this.setupMessageListener();
    this.injectStyles();
    this.isReady = true;
    this.notifyReady();
  }
  notifyReady() {
    try {
      chrome.runtime.sendMessage({ type: "CONTENT_SCRIPT_READY" });
    } catch (error) {
      console.log("Não foi possível notificar background script:", error);
    }
  }
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("📨 Mensagem recebida no content script:", message.type);
      if (message.type === "EXECUTE_STEP") {
        if (!this.isReady) {
          sendResponse({ success: false, error: "Content script não está pronto" });
          return;
        }
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
        sendResponse({ success: true, ready: this.isReady });
        return;
      }
    });
  }
  injectStyles() {
    if (document.getElementById("ai-assistant-styles")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "ai-assistant-styles";
    style.textContent = `
      .ai-assistant-highlight {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
        background-color: rgba(59, 130, 246, 0.1) !important;
        transition: all 0.3s ease !important;
      }
      
      .ai-assistant-executing {
        position: relative !important;
      }
      
      .ai-assistant-executing::after {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border: 2px solid #3b82f6;
        border-radius: 4px;
        animation: ai-pulse 1s infinite;
        pointer-events: none;
        z-index: 10000;
      }
      
      @keyframes ai-pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.02); }
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
    const target = document.head || document.documentElement;
    target.appendChild(style);
  }
  async executeStep(step) {
    console.log("🎯 Executando passo:", step);
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
    } finally {
      this.isExecuting = false;
    }
  }
  async navigate(url) {
    console.log("🌐 Navegando para:", url);
    return new Promise((resolve, reject) => {
      try {
        if (window.location.href === url) {
          resolve();
          return;
        }
        window.location.href = url;
        setTimeout(() => {
          resolve();
        }, 3e3);
      } catch (error) {
        reject(new Error(`Erro ao navegar: ${error.message}`));
      }
    });
  }
  async clickElement(selector) {
    console.log("🖱️ Clicando em:", selector);
    const element = await this.findElementWithRetry(selector, 5e3);
    if (!element) {
      throw new Error(`Elemento não encontrado: ${selector}`);
    }
    this.highlightElement(element);
    await this.wait(500);
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "center"
    });
    await this.wait(500);
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
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
      await this.wait(50);
    }
    if (element instanceof HTMLElement) {
      element.click();
    }
    this.removeHighlight(element);
    await this.wait(500);
  }
  async typeText(selector, text) {
    console.log("⌨️ Digitando em:", selector, "texto:", text);
    const element = await this.findElementWithRetry(selector, 5e3);
    if (!element) {
      throw new Error(`Campo de texto não encontrado: ${selector}`);
    }
    this.highlightElement(element);
    element.focus();
    await this.wait(300);
    element.value = "";
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    await this.wait(200);
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
      await this.wait(50 + Math.random() * 100);
    }
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
    this.removeHighlight(element);
  }
  async scroll(direction) {
    console.log("📜 Fazendo scroll:", direction);
    const scrollAmount = 300;
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
    window.scrollTo({
      top: targetScroll,
      behavior: "smooth"
    });
    await this.wait(1e3);
  }
  async findElementWithRetry(selector, timeout = 5e3) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = this.findElement(selector);
      if (element) {
        return element;
      }
      await this.wait(500);
    }
    return null;
  }
  findElement(selector) {
    console.log("🔍 Procurando elemento:", selector);
    const strategies = [
      () => document.querySelector(selector),
      () => document.querySelector(`[data-testid="${selector}"]`),
      () => document.querySelector(`[aria-label="${selector}"]`),
      () => document.querySelector(`[placeholder="${selector}"]`),
      () => document.querySelector(`[title="${selector}"]`),
      () => this.findByText(selector),
      () => this.findByPartialText(selector),
      () => this.findByRole(selector)
    ];
    for (const strategy of strategies) {
      try {
        const element = strategy();
        if (element && this.isElementVisible(element)) {
          console.log("✅ Elemento encontrado:", element);
          return element;
        }
      } catch (error) {
        continue;
      }
    }
    console.log("❌ Elemento não encontrado:", selector);
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
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none" && style.opacity !== "0";
  }
  highlightElement(element) {
    element.classList.add("ai-assistant-highlight", "ai-assistant-executing");
    const tooltip = document.createElement("div");
    tooltip.className = "ai-assistant-tooltip";
    tooltip.textContent = "Executando ação...";
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 40}px`;
    document.body.appendChild(tooltip);
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    }, 2e3);
  }
  removeHighlight(element) {
    element.classList.remove("ai-assistant-highlight", "ai-assistant-executing");
  }
  async wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
const automator = new WebAutomator();
window.webAutomator = automator;
