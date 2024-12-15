import { ModelConfig, SummarizationModel, SummarizationOptions } from '../types/models';
import { constructPrompt } from './prompts';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class GeminiModel implements SummarizationModel {
  private config: ModelConfig | null = null;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  async initialize(config: ModelConfig): Promise<void> {
    if (!config.apiKey) {
      throw new Error('API key is required for Gemini model');
    }

    const model = config.model || 'gemini-pro';
    const maxTokens = config.maxTokens !== undefined ? config.maxTokens : 1024;

    // Validate model name
    if (typeof model !== 'string' || !model.trim()) {
      throw new Error('Invalid model name');
    }

    // Validate max tokens
    if (typeof maxTokens !== 'number' || maxTokens <= 0) {
      throw new Error('Invalid max tokens value');
    }

    this.config = {
      ...config,
      model,
      maxTokens,
    };
  }

  async summarize(content: string, type: string): Promise<string> {
    if (!this.config) {
      throw new Error('Model not initialized');
    }

    const { apiKey, model, maxTokens } = this.config;

    const response = await fetch(`${this.baseUrl}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: content }] }],
        generationConfig: {
          maxOutputTokens: maxTokens,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch summary: ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for Gemini model
  }
}