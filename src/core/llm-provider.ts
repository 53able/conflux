import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import 'dotenv/config';
import { LLM_PROVIDER_CONFIGS, SUPPORTED_PROVIDERS, type LLMProviderType } from './constants.js';
import { getLogger } from './index.js';
import * as E from 'fp-ts/lib/Either.js';
import * as O from 'fp-ts/lib/Option.js';
import { pipe } from 'fp-ts/lib/function.js';
import { generateStructuredOutput, healthCheck } from './llm-integration.js';
import type { GenerationOptions, Schema } from './types.js';

const logger = getLogger();

/**
 * LLMプロバイダーの型定義（AI SDKの実際のプロバイダー型）
 */
export type LLMProvider = ReturnType<typeof openai> | ReturnType<typeof anthropic> | ReturnType<typeof google> | ReturnType<typeof createOpenAI> | MockProvider;

/**
 * AI SDKのLanguageModel型
 */
export type LanguageModel = Parameters<typeof generateObject>[0]['model'];

/**
 * モックプロバイダーの型定義
 */
export interface MockProvider {
  provider: string;
  modelId: string;
  settings: Record<string, unknown>;
}

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
 * LLMプロバイダーマネージャーの状態型定義
 */
type LLMProviderManagerState = {
  providers: Map<string, LLMProvider>;
  configs: Map<string, LLMProviderConfig>;
  defaultProvider: string | null;
};

/**
 * LLMプロバイダーマネージャーの状態管理
 */
const managerState: LLMProviderManagerState = {
  providers: new Map(),
  configs: new Map(),
  defaultProvider: null
};

/**
 * プロバイダー作成関数の型定義
 */
type ProviderCreator = (config: LLMProviderConfig) => LLMProvider;


/**
 * プロバイダー作成関数（シンプルなアプローチ）
 */
const createProviderCreator = (type: LLMProviderType): ProviderCreator => {
  const config = LLM_PROVIDER_CONFIGS[type];

  return (providerConfig: LLMProviderConfig) => {
    const modelName = providerConfig.model || config.model!;

    switch (type) {
      case 'openai':
        if (!providerConfig.apiKey && !process.env.OPENAI_API_KEY) {
          throw new Error('OpenAI API key is required');
        }
        return openai(modelName);

      case 'anthropic':
        if (!providerConfig.apiKey && !process.env.ANTHROPIC_API_KEY) {
          throw new Error('Anthropic API key is required');
        }
        return anthropic(modelName);

      case 'google':
        if (!providerConfig.apiKey && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          throw new Error('Google Generative AI API key is required');
        }
        return google(modelName);

      case 'openai-compatible':
        if (!providerConfig.baseURL) {
          throw new Error('Base URL is required for OpenAI-compatible provider');
        }
        return createOpenAI({
          apiKey: providerConfig.apiKey || 'dummy-key',
          baseURL: providerConfig.baseURL,
        })(modelName);

      case 'mock':
        return {
          provider: 'mock',
          modelId: modelName,
          settings: {},
        };

      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  };
};

/**
 * プロバイダー作成関数のマップ（動的生成）
 */
const providerCreators: Record<LLMProviderType, ProviderCreator> = SUPPORTED_PROVIDERS.reduce(
  (acc, type) => ({ ...acc, [type]: createProviderCreator(type) }),
  {} as Record<LLMProviderType, ProviderCreator>
);

/**
 * LLMプロバイダーを登録する関数
 */
export const registerProvider = (name: string, config: LLMProviderConfig): void => {
  const fullConfig = { ...LLM_PROVIDER_CONFIGS[config.type], ...config };
  managerState.configs.set(name, fullConfig);

  const creator = providerCreators[config.type];
  if (!creator) {
    throw new Error(`Unsupported provider type: ${config.type}`);
  }

  const provider = creator(fullConfig);
  managerState.providers.set(name, provider);

  // 最初に登録されたプロバイダーをデフォルトに設定
  if (!managerState.defaultProvider) {
    managerState.defaultProvider = name;
  }
};

/**
 * プロバイダーを取得する関数
 */
export const getProvider = (name?: string): LLMProvider => {
  const providerName = name || managerState.defaultProvider;
  if (!providerName) {
    throw new Error('No LLM provider available');
  }

  const provider = managerState.providers.get(providerName);
  if (!provider) {
    throw new Error(`LLM provider not found: ${providerName}`);
  }

  return provider;
};

/**
 * デフォルトプロバイダーを設定する関数
 */
export const setDefaultProvider = (name: string): void => {
  if (!managerState.providers.has(name)) {
    throw new Error(`Provider not registered: ${name}`);
  }
  managerState.defaultProvider = name;
};

/**
 * 登録済みプロバイダー一覧を取得する関数
 */
export const listProviders = (): string[] => {
  return Array.from(managerState.providers.keys());
};

/**
 * プロバイダー設定を取得する関数
 */
export const getConfig = (name: string): LLMProviderConfig | undefined => {
  return managerState.configs.get(name);
};

/**
 * LLMProviderをLanguageModelに変換する関数
 */
export const toLanguageModel = (provider: LLMProvider): LanguageModel => {
  // MockProviderの場合は特別な処理
  if ('provider' in provider && provider.provider === 'mock') {
    // モックプロバイダーの場合は、実際のモデルオブジェクトを返す
    // ここではOpenAIのモデルをデフォルトとして使用
    return openai('gpt-3.5-turbo') as LanguageModel;
  }
  
  // その他のプロバイダーはそのまま返す
  return provider as LanguageModel;
};

/**
 * プロバイダー登録のための純粋関数
 */
type ProviderRegistration = {
  type: LLMProviderType;
  apiKey?: string;
  model: string;
};

const createProviderRegistration = (
  type: LLMProviderType,
  apiKeyEnvVar: string,
  modelEnvVar: string
): O.Option<ProviderRegistration> => {
  const apiKey = process.env[apiKeyEnvVar];
  const model = process.env[modelEnvVar];
  const config = LLM_PROVIDER_CONFIGS[type];
  
  return apiKey ? O.some({
    type,
    apiKey,
    model: model || config.model,
  }) : O.none;
};

const registerProviderIfAvailable = (registration: ProviderRegistration): E.Either<Error, undefined> => {
  return E.tryCatch(
    () => {
      registerProvider(registration.type, registration);
      return undefined;
    },
    (error) => error as Error
  );
};

const setDefaultProviderIfAvailable = (providerType: LLMProviderType): E.Either<Error, undefined> => {
  return E.tryCatch(
    () => {
      setDefaultProvider(providerType);
      return undefined;
    },
    (error) => error as Error
  );
};

/**
 * グローバルLLMプロバイダーマネージャーの初期化（関数型版）
 */
export const initializeDefaultProviders = (): void => {
  // プロバイダー登録の設定
  const providerConfigs = [
    { type: 'openai' as const, apiKeyEnv: 'OPENAI_API_KEY', modelEnv: 'OPENAI_MODEL' },
    { type: 'anthropic' as const, apiKeyEnv: 'ANTHROPIC_API_KEY', modelEnv: 'ANTHROPIC_MODEL' },
    { type: 'google' as const, apiKeyEnv: 'GOOGLE_GENERATIVE_AI_API_KEY', modelEnv: 'GOOGLE_MODEL' },
  ];

  // 利用可能なプロバイダーを登録
  const registrationResults = providerConfigs
    .map(config => createProviderRegistration(config.type, config.apiKeyEnv, config.modelEnv))
    .map(registration => 
      pipe(
        registration,
        O.map(registerProviderIfAvailable),
        O.getOrElse(() => E.right(undefined))
      )
    );

  // エラーログ出力
  registrationResults.forEach(result => {
    if (E.isLeft(result)) {
      logger.warn('Failed to register provider:', result.left);
    }
  });

  // モックプロバイダーを常に登録
  const mockConfig = LLM_PROVIDER_CONFIGS.mock;
  const mockRegistration: ProviderRegistration = {
    type: 'mock',
    model: mockConfig.model,
  };
  
  pipe(
    registerProviderIfAvailable(mockRegistration),
    E.fold(
      (error) => logger.warn('Failed to register mock provider:', error),
      () => logger.info('Mock provider registered successfully')
    )
  );

  // デフォルトプロバイダーの設定
  const defaultProviderResult = pipe(
    O.fromNullable(process.env.DEFAULT_LLM_PROVIDER),
    O.fold(
      () => {
        // 自動選択ロジック
        if (process.env.OPENAI_API_KEY) {
          return setDefaultProviderIfAvailable('openai');
        } else if (process.env.ANTHROPIC_API_KEY) {
          return setDefaultProviderIfAvailable('anthropic');
        } else if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          return setDefaultProviderIfAvailable('google');
        } else {
          return E.right(undefined);
        }
      },
      (providerName) => setDefaultProviderIfAvailable(providerName as LLMProviderType)
    )
  );

  // デフォルトプロバイダー設定の結果を処理
  pipe(
    defaultProviderResult,
    E.fold(
      (error) => logger.warn('Failed to set default provider:', error),
      () => logger.info('Default provider set successfully')
    )
  );
};

// 自動初期化
initializeDefaultProviders();

/**
 * グローバルLLMプロバイダーマネージャー
 */
export const globalLLMManager = {
  getProvider: (name?: string) => getProvider(name),
  getIntegration: () => ({
    generateStructuredOutput: async <T>(
      schema: Schema,
      systemPrompt: string,
      userPrompt: string,
      providerName?: string,
      options?: GenerationOptions
    ): Promise<T> => {
      const result = await generateStructuredOutput(schema, systemPrompt, userPrompt, providerName, options);
      return result as T;
    },
    generateText: async (
      systemPrompt: string,
      userPrompt: string,
      providerName?: string,
      options?: GenerationOptions
    ): Promise<string> => {
      const provider = getProvider(providerName);
      const result = await generateText({
        model: provider as LanguageModel,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: options?.temperature ?? 0.3,
      });
      return result.text;
    },
    healthCheck: async (providerName?: string): Promise<boolean> => {
      return await healthCheck(providerName);
    }
  }),
  listProviders: () => listProviders(),
  registerProvider: (name: string, config: LLMProviderConfig) => registerProvider(name, config),
  setDefaultProvider: (name: string) => setDefaultProvider(name),
  getConfig: (name: string) => getConfig(name)
};
