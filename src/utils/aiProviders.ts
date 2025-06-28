import { AIProvider } from '../types';

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    description: 'O mais popular e confiável. Ideal para iniciantes.',
    setupUrl: 'https://platform.openai.com/api-keys',
    costInfo: 'Aproximadamente R$ 0,10 por 100 tarefas simples',
    apiKeyLabel: 'Chave da API OpenAI',
    icon: '🤖',
    defaultModels: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview']
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gratuito com limite diário. Ótima opção para começar.',
    setupUrl: 'https://aistudio.google.com/app/apikey',
    costInfo: 'Gratuito até 60 requisições por minuto',
    apiKeyLabel: 'Chave da API Gemini',
    icon: '✨',
    defaultModels: ['gemini-1.5-flash', 'gemini-1.5-pro']
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Roda no seu computador. Totalmente gratuito e privado.',
    setupUrl: 'https://ollama.ai/download',
    costInfo: 'Completamente gratuito (requer instalação local)',
    apiKeyLabel: 'URL do Ollama (ex: http://localhost:11434)',
    icon: '🏠',
    defaultModels: ['llama2', 'codellama', 'mistral']
  }
];

export const getProviderById = (id: string): AIProvider | undefined => {
  return AI_PROVIDERS.find(provider => provider.id === id);
};