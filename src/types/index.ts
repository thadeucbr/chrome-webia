export interface AIProvider {
  id: string;
  name: string;
  description: string;
  setupUrl: string;
  costInfo: string;
  apiKeyLabel: string;
  icon: string;
}

export interface UserSettings {
  selectedProvider: string;
  apiKey: string;
  isConfigured: boolean;
  hasCompletedOnboarding: boolean;
}

export interface TaskInstruction {
  id: string;
  instruction: string;
  timestamp: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  steps?: TaskStep[];
}

export interface TaskStep {
  id: string;
  description: string;
  action: 'navigate' | 'click' | 'type' | 'wait' | 'scroll';
  target?: string;
  value?: string;
  completed: boolean;
}

export interface AIResponse {
  steps: TaskStep[];
  explanation: string;
  warnings?: string[];
}