import { AIResponse, TaskStep } from '../types';
import { getSettings } from './storage';

export class AIService {
  private async makeRequest(prompt: string): Promise<string> {
    const settings = await getSettings();
    
    if (!settings.isConfigured) {
      throw new Error('IA não configurada. Configure primeiro nas opções.');
    }

    switch (settings.selectedProvider) {
      case 'openai':
        return this.callOpenAI(prompt, settings.apiKey);
      case 'gemini':
        return this.callGemini(prompt, settings.apiKey);
      case 'ollama':
        return this.callOllama(prompt, settings.apiKey);
      default:
        throw new Error('Provedor de IA não suportado');
    }
  }

  private async callOpenAI(prompt: string, apiKey: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente que converte instruções em passos de automação web. Responda sempre em JSON com formato: {"steps": [{"action": "navigate|click|type|wait", "target": "seletor ou URL", "value": "texto se necessário", "description": "descrição do passo"}], "explanation": "explicação do que será feito", "warnings": ["avisos se houver"]}'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API OpenAI: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callGemini(prompt: string, apiKey: string): Promise<string> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Você é um assistente que converte instruções em passos de automação web. Responda sempre em JSON com formato: {"steps": [{"action": "navigate|click|type|wait", "target": "seletor ou URL", "value": "texto se necessário", "description": "descrição do passo"}], "explanation": "explicação do que será feito", "warnings": ["avisos se houver"]}

Instrução: ${prompt}`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na API Gemini: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  private async callOllama(prompt: string, baseUrl: string): Promise<string> {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama2',
        prompt: `Você é um assistente que converte instruções em passos de automação web. Responda sempre em JSON com formato: {"steps": [{"action": "navigate|click|type|wait", "target": "seletor ou URL", "value": "texto se necessário", "description": "descrição do passo"}], "explanation": "explicação do que será feito", "warnings": ["avisos se houver"]}

Instrução: ${prompt}`,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Erro no Ollama: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  }

  async processInstruction(instruction: string): Promise<AIResponse> {
    try {
      const response = await this.makeRequest(instruction);
      const parsed = JSON.parse(response);
      
      return {
        steps: parsed.steps.map((step: any, index: number) => ({
          id: `step-${index}`,
          description: step.description,
          action: step.action,
          target: step.target,
          value: step.value,
          completed: false
        })),
        explanation: parsed.explanation,
        warnings: parsed.warnings || []
      };
    } catch (error) {
      console.error('Erro ao processar instrução:', error);
      throw new Error('Não foi possível processar a instrução. Verifique sua configuração de IA.');
    }
  }
}

export const aiService = new AIService();