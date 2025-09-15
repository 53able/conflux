import * as E from 'fp-ts/lib/Either.js';
import type { GenerationOptions, Schema } from './types.js';
import { 
  generateStructuredOutputTaskEither,
  generateTextTaskEither,
  healthCheckTaskEither
} from './generation-core.js';
import { 
  generateWithFallbackTaskEither
} from './fallback-handlers.js';

/**
 * 構造化されたオブジェクト生成（自動復旧機能付き）
 */
export const generateStructuredOutput = async <T>(
  schema: Schema,
  systemPrompt: string,
  userPrompt: string,
  providerName?: string,
  options?: GenerationOptions
): Promise<T> => {
  const result = await generateStructuredOutputEither<T>(
    schema,
    systemPrompt,
    userPrompt,
    providerName,
    options
  );
  
  return E.fold(
    (error: Error) => { throw error; },
    (value: T) => value
  )(result);
};

/**
 * 構造化されたオブジェクト生成（Either型でエラーハンドリング - 後方互換性のため）
 */
export const generateStructuredOutputEither = async <T>(
  schema: Schema,
  systemPrompt: string,
  userPrompt: string,
  providerName?: string,
  options?: GenerationOptions
): Promise<E.Either<Error, T>> => {
  const result = await generateStructuredOutputTaskEither(schema, systemPrompt, userPrompt, providerName, options)();
  return result as E.Either<Error, T>;
};

// コア生成機能を再エクスポート
export { generateStructuredOutputTaskEither } from './generation-core.js';

// スキーマ関連のユーティリティを再エクスポート
export { 
  generateSchemaExample, 
  generateSchemaInstructions 
} from './schema-utils.js';


/**
 * テキスト生成
 */
export const generateText = async (
  systemPrompt: string,
  userPrompt: string,
  providerName?: string,
  options?: GenerationOptions
): Promise<string> => {
  const result = await generateTextEither(systemPrompt, userPrompt, providerName, options);
  return E.fold(
    (error: Error) => { throw error; },
    (value: string) => value
  )(result);
};

/**
 * テキスト生成（Either型でエラーハンドリング - 後方互換性のため）
 */
export const generateTextEither = async (
  systemPrompt: string,
  userPrompt: string,
  providerName?: string,
  options?: GenerationOptions
): Promise<E.Either<Error, string>> => {
  return await generateTextTaskEither(systemPrompt, userPrompt, providerName, options)();
};

/**
 * 複数プロバイダーでのフォールバック生成
 */
export const generateWithFallback = async <T>(
  schema: Schema,
  systemPrompt: string,
  userPrompt: string,
  options?: GenerationOptions
): Promise<T> => {
  const result = await generateWithFallbackEither<T>(schema, systemPrompt, userPrompt, options);
  return E.fold(
    (error: Error) => { throw error; },
    (value: T) => value
  )(result);
};

/**
 * 複数プロバイダーでのフォールバック生成（Either型でエラーハンドリング - 後方互換性のため）
 */
export const generateWithFallbackEither = async <T>(
  schema: Schema,
  systemPrompt: string,
  userPrompt: string,
  options?: GenerationOptions
): Promise<E.Either<Error, T>> => {
  const result = await generateWithFallbackTaskEither(schema, systemPrompt, userPrompt, options, generateStructuredOutputTaskEither)();
  return result as E.Either<Error, T>;
};

/**
 * プロバイダーのヘルスチェック
 */
export const healthCheck = async (providerName?: string): Promise<boolean> => {
  const result = await healthCheckEither(providerName);
  return E.isRight(result);
};

/**
 * プロバイダーのヘルスチェック（Either型でエラーハンドリング - 後方互換性のため）
 */
export const healthCheckEither = async (providerName?: string): Promise<E.Either<Error, boolean>> => {
  return await healthCheckTaskEither(providerName)();
};

// その他の機能を再エクスポート
export { 
  generateTextTaskEither,
  healthCheckTaskEither
} from './generation-core.js';

export { 
  generateWithFallbackTaskEither
} from './fallback-handlers.js';

