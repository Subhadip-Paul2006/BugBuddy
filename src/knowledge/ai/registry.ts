/**
 * BugBuddy Knowledge Base — AI Provider Registry
 * 
 * Manages available AI providers, resolves default provider based on
 * available environment credentials, and allows dynamic registration.
 */

import { AIProvider, AIProviderId } from './types';
import { MockAIProvider } from './providers/mockProvider';
import { GeminiProvider } from './providers/geminiProvider';
import { OpenAIProvider } from './providers/openaiProvider';

export class AIProviderRegistry {
  private providers: Map<AIProviderId, AIProvider> = new Map();
  private defaultProviderId: AIProviderId = 'mock';

  constructor() {
    // Register standard providers
    this.registerProvider(new MockAIProvider());
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new OpenAIProvider());

    // Resolve default provider based on environment variables
    this.resolveDefaultFromEnv();
  }

  private resolveDefaultFromEnv(): void {
    if (typeof process === 'undefined' || !process.env) return;

    const explicitDefault = process.env.DEFAULT_AI_PROVIDER as AIProviderId | undefined;
    if (explicitDefault && this.providers.has(explicitDefault)) {
      this.defaultProviderId = explicitDefault;
      return;
    }

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0) {
      this.defaultProviderId = 'openai';
    } else if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
      this.defaultProviderId = 'gemini';
    } else {
      this.defaultProviderId = 'mock';
    }
  }

  public registerProvider(provider: AIProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  public getProvider(id: AIProviderId): AIProvider | undefined {
    return this.providers.get(id);
  }

  public getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  public setDefaultProviderId(id: AIProviderId): void {
    if (!this.providers.has(id)) {
      throw new Error(`Cannot set default: Provider '${id}' is not registered.`);
    }
    this.defaultProviderId = id;
  }

  public getDefaultProviderId(): AIProviderId {
    return this.defaultProviderId;
  }

  /**
   * Resolves the primary available provider (requested or default).
   */
  public async getActiveProvider(requestedId?: AIProviderId): Promise<AIProvider> {
    const targetId = requestedId || this.defaultProviderId;
    const provider = this.providers.get(targetId);

    if (provider) {
      const isAvail = await provider.isAvailable();
      if (isAvail) return provider;
    }

    // Fall back to mock provider if chosen provider is unavailable
    const mock = this.providers.get('mock');
    if (mock) return mock;

    throw new Error('No AI provider available in registry (including mock provider).');
  }
}

export const defaultAIProviderRegistry = new AIProviderRegistry();
