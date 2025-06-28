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
        return this.callOpenAI(prompt, settings.apiKey, settings.selectedModel);
      case 'gemini':
        return this.callGemini(prompt, settings.apiKey, settings.selectedModel);
      case 'ollama':
        return this.callOllama(prompt, settings.apiKey, settings.selectedModel);
      default:
        throw new Error('Provedor de IA não suportado');
    }
  }

  private async callOpenAI(prompt: string, apiKey: string, model: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
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
      const errorData = await response.text();
      throw new Error(`Erro na API OpenAI: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callGemini(prompt: string, apiKey: string, model: string): Promise<string> {
    // Usar modelo padrão mais recente se não especificado
    const modelName = model || 'gemini-1.5-flash';
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
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
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro na API Gemini: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Resposta inválida da API Gemini');
    }
    
    return data.candidates[0].content.parts[0].text;
  }

  private async callOllama(prompt: string, baseUrl: string, model: string): Promise<string> {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'llama2',
        prompt: `Você é um assistente que converte instruções em passos de automação web. Responda sempre em JSON com formato: {"steps": [{"action": "navigate|click|type|wait", "target": "seletor ou URL", "value": "texto se necessário", "description": "descrição do passo"}], "explanation": "explicação do que será feito", "warnings": ["avisos se houver"]}

Instrução: ${prompt}`,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro no Ollama: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return data.response;
  }

  async processInstruction(instruction: string): Promise<AIResponse> {
    try {
      const response = await this.makeRequest(instruction);
      
      // Tentar extrair JSON da resposta
      let jsonStr = response;
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      const parsed = JSON.parse(jsonStr);
      
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
      throw new Error(`Não foi possível processar a instrução: ${error.message}`);
    }
  }
}

export const aiService = new AIService();