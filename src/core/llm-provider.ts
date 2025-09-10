import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';
import 'dotenv/config';

/**
 * サポートするLLMプロバイダーの種類
 */
export type LLMProviderType = 'openai' | 'anthropic' | 'google' | 'openai-compatible' | 'mock';

/**
 * LLMプロバイダー設定
 */
export interface LLMProviderConfig {
  type: LLMProviderType;
  apiKey?: string;
  baseURL?: string;
  model?: string;
  defaultParams?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
}

/**
 * デフォルトのLLMプロバイダー設定
 */
const DEFAULT_CONFIGS: Record<LLMProviderType, Partial<LLMProviderConfig>> = {
  openai: {
    model: process.env.OPENAI_MODEL || 'gpt-5',
    defaultParams: {
      temperature: 0.3,
      maxTokens: 2000,
    },
  },
  anthropic: {
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-latest',
    defaultParams: {
      temperature: 0.3,
      maxTokens: 2000,
    },
  },
  google: {
    model: process.env.GOOGLE_MODEL || 'gemini-2.0-flash-exp',
    defaultParams: {
      temperature: 0.3,
      maxTokens: 2000,
    },
  },
  'openai-compatible': {
    model: 'gpt-3.5-turbo',
    defaultParams: {
      temperature: 0.3,
      maxTokens: 2000,
    },
  },
  mock: {
    model: 'mock-model',
    defaultParams: {
      temperature: 0.3,
      maxTokens: 2000,
    },
  },
};

/**
 * LLMプロバイダーマネージャー
 * 
 * 機能:
 * 1. 複数のLLMプロバイダーの統一管理
 * 2. プロバイダー固有の設定管理
 * 3. フォールバック機能
 * 4. レート制限対応
 * 5. エラーハンドリング
 */
export class LLMProviderManager {
  private providers: Map<string, any> = new Map();
  private configs: Map<string, LLMProviderConfig> = new Map();
  private defaultProvider?: string;

  /**
   * LLMプロバイダーを登録
   */
  registerProvider(name: string, config: LLMProviderConfig): void {
    const fullConfig = { ...DEFAULT_CONFIGS[config.type], ...config };
    this.configs.set(name, fullConfig);

    let provider: any;

    switch (config.type) {
      case 'openai':
        provider = this.createOpenAIProvider(fullConfig);
        break;
      case 'anthropic':
        provider = this.createAnthropicProvider(fullConfig);
        break;
      case 'google':
        provider = this.createGoogleProvider(fullConfig);
        break;
      case 'openai-compatible':
        provider = this.createOpenAICompatibleProvider(fullConfig);
        break;
      case 'mock':
        provider = this.createMockProvider(fullConfig);
        break;
      default:
        throw new Error(`Unsupported provider type: ${config.type}`);
    }

    this.providers.set(name, provider);

    // 最初に登録されたプロバイダーをデフォルトに設定
    if (!this.defaultProvider) {
      this.defaultProvider = name;
    }
  }

  /**
   * プロバイダーを取得
   */
  getProvider(name?: string): any {
    const providerName = name || this.defaultProvider;
    if (!providerName) {
      throw new Error('No LLM provider available');
    }

    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`LLM provider not found: ${providerName}`);
    }

    return provider;
  }

  /**
   * デフォルトプロバイダーを設定
   */
  setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider not registered: ${name}`);
    }
    this.defaultProvider = name;
  }

  /**
   * 登録済みプロバイダー一覧を取得
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * プロバイダー設定を取得
   */
  getConfig(name: string): LLMProviderConfig | undefined {
    return this.configs.get(name);
  }

  /**
   * OpenAIプロバイダーを作成
   */
  private createOpenAIProvider(config: LLMProviderConfig): any {
    if (!config.apiKey && !process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required');
    }
    
    // AI SDK v5の公式パターンに従う
    const modelName = config.model || process.env.OPENAI_MODEL || 'gpt-5';
    return openai(modelName);
  }

  /**
   * Anthropicプロバイダーを作成
   */
  private createAnthropicProvider(config: LLMProviderConfig): any {
    if (!config.apiKey && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key is required');
    }
    
    // AI SDK v5の公式パターンに従う
    const modelName = config.model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-latest';
    return anthropic(modelName);
  }

  /**
   * Googleプロバイダーを作成
   */
  private createGoogleProvider(config: LLMProviderConfig): any {
    if (!config.apiKey && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('Google Generative AI API key is required');
    }
    
    // AI SDK v5の公式パターンに従う
    const modelName = config.model || process.env.GOOGLE_MODEL || 'gemini-2.0-flash-exp';
    return google(modelName);
  }

  /**
   * OpenAI互換プロバイダーを作成
   */
  private createOpenAICompatibleProvider(config: LLMProviderConfig): any {
    if (!config.baseURL) {
      throw new Error('Base URL is required for OpenAI-compatible provider');
    }

    const provider = createOpenAI({
      apiKey: config.apiKey || 'dummy-key',
      baseURL: config.baseURL,
    });

    return provider(config.model || 'gpt-3.5-turbo');
  }

  /**
   * モックプロバイダーを作成（テスト用）
   */
  private createMockProvider(config: LLMProviderConfig): any {
    // モック実装 - 実際のLLMの代わりにダミーレスポンスを返す
    // モックプロバイダーの実装は実際のLLMを使用しない開発・テスト用
    return {
      provider: 'mock',
      modelId: config.model || 'mock-model',
      settings: {},
    } as any;
  }
}

/**
 * LLM統合ヘルパークラス
 * 
 * 思考法エージェント向けの便利メソッドを提供
 */
export class LLMIntegration {
  constructor(private providerManager: LLMProviderManager) {}

  /**
   * 構造化されたオブジェクト生成（自動復旧機能付き）
   */
  async generateStructuredOutput<T>(
    schema: any,
    systemPrompt: string,
    userPrompt: string,
    providerName?: string,
    options?: {
      temperature?: number;
      maxRetries?: number;
      enableAutoRecovery?: boolean;
    }
  ): Promise<T> {
    const provider = this.providerManager.getProvider(providerName);
    const maxRetries = options?.maxRetries || 3;
    const enableAutoRecovery = options?.enableAutoRecovery ?? true;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await generateObject({
          model: provider,
          schema,
          system: systemPrompt,
          prompt: userPrompt,
          temperature: options?.temperature ?? 0.3,
        });

        // スキーマ検証（Zodスキーマの場合）
        if (schema.safeParse && enableAutoRecovery) {
          const validation = schema.safeParse(result.object);
          if (!validation.success) {
            throw new Error(`Schema validation failed: ${validation.error.message}`);
          }
        }

        return result.object as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`LLM generation attempt ${attempt} failed:`, lastError.message);
        
        // 自動復旧機能：エラー内容に応じてプロンプトを調整
        if (enableAutoRecovery && attempt < maxRetries) {
          if (lastError.message.includes('Schema validation failed')) {
            // スキーマエラーの場合：プロンプトに詳細な指示を追加
            systemPrompt = this.enhancePromptForSchemaCompliance(systemPrompt, schema, lastError);
          } else if (lastError.message.includes('timeout') || lastError.message.includes('rate limit')) {
            // タイムアウトやレート制限の場合：温度を下げて安定化
            options = { ...options, temperature: Math.max((options?.temperature ?? 0.3) * 0.8, 0.1) };
          }
        }
        
        if (attempt === maxRetries) {
          // 全ての試行が失敗した場合、フォールバックプロバイダーを試行
          if (enableAutoRecovery) {
            return await this.tryFallbackProviders<T>(
              schema, systemPrompt, userPrompt, providerName, options
            );
          }
          throw new Error(`LLM generation failed after ${maxRetries} attempts: ${lastError.message}`);
        }
        
        // 指数バックオフで再試行
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }
    
    throw new Error('Unexpected error in LLM generation');
  }

  /**
   * スキーマ準拠のためのプロンプト強化
   */
  private enhancePromptForSchemaCompliance(
    originalPrompt: string, 
    schema: any, 
    error: Error
  ): string {
    const schemaInfo = this.extractSchemaRequirements(schema);
    return `${originalPrompt}

**重要**: 以下のJSONスキーマに厳密に準拠した形式で応答してください：

${schemaInfo}

前回のエラー: ${error.message}

必須フィールドをすべて含め、データ型を正確に守ってください。`;
  }

  /**
   * スキーマ要件の抽出
   */
  private extractSchemaRequirements(schema: any): string {
    try {
      if (schema._def) {
        // Zodスキーマの場合
        return `Zodスキーマ型: ${schema._def.typeName || 'Object'}`;
      }
      return 'JSONスキーマに準拠してください';
    } catch {
      return '指定されたスキーマ形式に準拠してください';
    }
  }

  /**
   * フォールバックプロバイダーでの再試行
   */
  private async tryFallbackProviders<T>(
    schema: any,
    systemPrompt: string,
    userPrompt: string,
    excludeProvider?: string,
    options?: any
  ): Promise<T> {
    const availableProviders = this.providerManager.listProviders()
      .filter(name => name !== excludeProvider);
    
    for (const providerName of availableProviders) {
      try {
        console.warn(`Trying fallback provider: ${providerName}`);
        return await this.generateStructuredOutput<T>(
          schema, systemPrompt, userPrompt, providerName, 
          { ...options, maxRetries: 1, enableAutoRecovery: false }
        );
      } catch (error) {
        console.warn(`Fallback provider ${providerName} also failed:`, error);
        continue;
      }
    }
    
    throw new Error('All providers failed, including fallbacks');
  }

  /**
   * テキスト生成
   */
  async generateText(
    systemPrompt: string,
    userPrompt: string,
    providerName?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      maxRetries?: number;
    }
  ): Promise<string> {
    const provider = this.providerManager.getProvider(providerName);
    const maxRetries = options?.maxRetries || 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await generateText({
          model: provider,
          system: systemPrompt,
          prompt: userPrompt,
          temperature: options?.temperature ?? 0.3,
        });

        return result.text;
      } catch (error) {
        console.warn(`LLM text generation attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw new Error(`LLM text generation failed after ${maxRetries} attempts: ${error}`);
        }
        
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }
    
    throw new Error('Unexpected error in LLM text generation');
  }

  /**
   * 複数プロバイダーでのフォールバック生成
   */
  async generateWithFallback<T>(
    schema: any,
    systemPrompt: string,
    userPrompt: string,
    providerNames?: string[],
    options?: { temperature?: number }
  ): Promise<T> {
    const providers = providerNames || this.providerManager.listProviders();
    
    for (const providerName of providers) {
      try {
        return await this.generateStructuredOutput<T>(
          schema,
          systemPrompt,
          userPrompt,
          providerName,
          { ...options, maxRetries: 1 }
        );
      } catch (error) {
        console.warn(`Provider ${providerName} failed, trying next...`);
        continue;
      }
    }
    
    throw new Error('All LLM providers failed');
  }

  /**
   * プロバイダーのヘルスチェック
   */
  async healthCheck(providerName?: string): Promise<boolean> {
    try {
      await this.generateText(
        'You are a helpful assistant.',
        'Say "OK" if you can respond.',
        providerName,
        { maxRetries: 1, maxTokens: 10 }
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * スリープユーティリティ
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * グローバルLLMプロバイダーマネージャーのインスタンス
 */
export const globalLLMManager = new LLMProviderManager();

/**
 * デフォルト設定でプロバイダーを初期化
 */
export function initializeDefaultProviders(): void {
  // OpenAIプロバイダー（環境変数があれば）
  if (process.env.OPENAI_API_KEY) {
    globalLLMManager.registerProvider('openai', {
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Anthropicプロバイダー（環境変数があれば）
  if (process.env.ANTHROPIC_API_KEY) {
    globalLLMManager.registerProvider('anthropic', {
      type: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  // Googleプロバイダー（環境変数があれば）
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    globalLLMManager.registerProvider('google', {
      type: 'google',
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });
  }

  // モックプロバイダー（開発・テスト用）
  globalLLMManager.registerProvider('mock', {
    type: 'mock',
  });

  // 環境変数からデフォルトプロバイダーを設定
  const defaultProvider = process.env.DEFAULT_LLM_PROVIDER;
  if (defaultProvider && ['openai', 'anthropic', 'google', 'mock'].includes(defaultProvider)) {
    // 指定されたプロバイダーが利用可能かチェック
    const isOpenAIAvailable = process.env.OPENAI_API_KEY;
    const isAnthropicAvailable = process.env.ANTHROPIC_API_KEY;
    const isGoogleAvailable = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    if (defaultProvider === 'openai' && isOpenAIAvailable) {
      globalLLMManager.setDefaultProvider('openai');
    } else if (defaultProvider === 'anthropic' && isAnthropicAvailable) {
      globalLLMManager.setDefaultProvider('anthropic');
    } else if (defaultProvider === 'google' && isGoogleAvailable) {
      globalLLMManager.setDefaultProvider('google');
    } else if (defaultProvider === 'mock') {
      globalLLMManager.setDefaultProvider('mock');
    }
  } else {
    // 環境変数で指定されていない場合、利用可能なプロバイダーから自動選択（OpenAI優先）
    if (process.env.OPENAI_API_KEY) {
      globalLLMManager.setDefaultProvider('openai');
    } else if (process.env.ANTHROPIC_API_KEY) {
      globalLLMManager.setDefaultProvider('anthropic');
    } else if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      globalLLMManager.setDefaultProvider('google');
    }
  }
}

// 自動初期化
initializeDefaultProviders();
