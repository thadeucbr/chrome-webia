// Content script para executar ações na página
class WebAutomator {
  private isExecuting = false;

  constructor() {
    this.setupMessageListener();
    this.injectStyles();
  }

  private setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'EXECUTE_STEP') {
        this.executeStep(message.step)
          .then(() => sendResponse({ success: true }))
          .catch((error) => sendResponse({ success: false, error: error.message }));
        return true; // Indica resposta assíncrona
      }
    });
  }

  private injectStyles() {
    const style = document.createElement('style');
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
      }
      
      @keyframes ai-pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.02); }
        100% { opacity: 1; transform: scale(1); }
      }
      
      .ai-assistant-tooltip {
        position: absolute;
        background: #1f2937;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        z-index: 10000;
        pointer-events: none;
        white-space: nowrap;
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
    document.head.appendChild(style);
  }

  private async executeStep(step: any): Promise<void> {
    this.isExecuting = true;
    
    try {
      switch (step.action) {
        case 'navigate':
          await this.navigate(step.target);
          break;
        case 'click':
          await this.clickElement(step.target);
          break;
        case 'type':
          await this.typeText(step.target, step.value);
          break;
        case 'wait':
          await this.wait(step.value ? parseInt(step.value) : 1000);
          break;
        case 'scroll':
          await this.scroll(step.target);
          break;
        default:
          throw new Error(`Ação não suportada: ${step.action}`);
      }
    } finally {
      this.isExecuting = false;
    }
  }

  private async navigate(url: string): Promise<void> {
    return new Promise((resolve) => {
      window.location.href = url;
      // Aguardar carregamento da página
      setTimeout(resolve, 2000);
    });
  }

  private async clickElement(selector: string): Promise<void> {
    const element = this.findElement(selector);
    if (!element) {
      throw new Error(`Elemento não encontrado: ${selector}`);
    }

    this.highlightElement(element);
    await this.wait(500);

    // Simular clique humano
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Scroll para o elemento se necessário
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await this.wait(300);

    // Disparar eventos de mouse
    const events = ['mousedown', 'mouseup', 'click'];
    events.forEach(eventType => {
      const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y
      });
      element.dispatchEvent(event);
    });

    this.removeHighlight(element);
  }

  private async typeText(selector: string, text: string): Promise<void> {
    const element = this.findElement(selector) as HTMLInputElement | HTMLTextAreaElement;
    if (!element) {
      throw new Error(`Campo de texto não encontrado: ${selector}`);
    }

    this.highlightElement(element);
    element.focus();
    await this.wait(300);

    // Limpar campo existente
    element.value = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));

    // Digitar texto caractere por caractere
    for (let i = 0; i < text.length; i++) {
      element.value += text[i];
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await this.wait(50 + Math.random() * 100); // Velocidade humana variável
    }

    element.dispatchEvent(new Event('change', { bubbles: true }));
    this.removeHighlight(element);
  }

  private async scroll(direction: string): Promise<void> {
    const scrollAmount = 300;
    const currentScroll = window.pageYOffset;
    
    let targetScroll: number;
    switch (direction.toLowerCase()) {
      case 'up':
        targetScroll = Math.max(0, currentScroll - scrollAmount);
        break;
      case 'down':
        targetScroll = currentScroll + scrollAmount;
        break;
      case 'top':
        targetScroll = 0;
        break;
      case 'bottom':
        targetScroll = document.body.scrollHeight;
        break;
      default:
        targetScroll = parseInt(direction) || currentScroll;
    }

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });

    await this.wait(500);
  }

  private findElement(selector: string): Element | null {
    // Tentar diferentes estratégias de seleção
    const strategies = [
      () => document.querySelector(selector),
      () => document.querySelector(`[data-testid="${selector}"]`),
      () => document.querySelector(`[aria-label="${selector}"]`),
      () => document.querySelector(`[placeholder="${selector}"]`),
      () => this.findByText(selector),
      () => this.findByPartialText(selector)
    ];

    for (const strategy of strategies) {
      try {
        const element = strategy();
        if (element) return element;
      } catch (error) {
        continue;
      }
    }

    return null;
  }

  private findByText(text: string): Element | null {
    const xpath = `//*[text()="${text}"]`;
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue as Element;
  }

  private findByPartialText(text: string): Element | null {
    const xpath = `//*[contains(text(), "${text}")]`;
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue as Element;
  }

  private highlightElement(element: Element): void {
    element.classList.add('ai-assistant-highlight', 'ai-assistant-executing');
    
    // Adicionar tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'ai-assistant-tooltip';
    tooltip.textContent = 'Executando ação...';
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 40}px`;
    
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    }, 2000);
  }

  private removeHighlight(element: Element): void {
    element.classList.remove('ai-assistant-highlight', 'ai-assistant-executing');
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Inicializar o automatizador quando a página carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new WebAutomator());
} else {
  new WebAutomator();
}