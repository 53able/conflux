import * as TE from 'fp-ts/lib/TaskEither.js';
import { getLogger } from './logger.js';
import type { GenerationOptions, Schema } from './types.js';
import { extractSchemaRequirements } from './schema-utils.js';

/**
 * スキーマ準拠のためのプロンプト強化
 */
export const enhancePromptForSchemaCompliance = (
  originalPrompt: string, 
  schema: Schema, 
  error: Error
): string => {
  const schemaRequirements = extractSchemaRequirements(schema);
  return `${originalPrompt}

【重要】スキーマ準拠のための追加指示:
${schemaRequirements}

前回のエラー: ${error.message}

【必須】以下の点を厳密に守ってください:
1. JSONのみを出力し、他のテキストは含めない
2. すべての必須フィールドを含める
3. データ型を正確に指定する（文字列、数値、配列、オブジェクト）
4. 列挙値は指定された値のみを使用する
5. 数値の範囲制限を守る

このエラーを避けるため、出力形式を正確に守ってください。`;
};

/**
 * 自動復旧処理（関数型パターン）
 */
export const handleAutoRecovery = <T>(
  error: Error,
  attempt: number,
  currentSystemPrompt: string,
  currentOptions: GenerationOptions | undefined,
  schema: Schema,
  _systemPrompt: string,
  _userPrompt: string,
  _providerName: string | undefined,
  _options: GenerationOptions | undefined,
  executeAttempt: (attempt: number, systemPrompt: string, options: GenerationOptions | undefined) => TE.TaskEither<Error, T>
): TE.TaskEither<Error, T> => {
  if (error.message.includes('Schema validation failed')) {
    // スキーマエラーの場合：プロンプトに詳細な指示を追加
    const enhancedPrompt = enhancePromptForSchemaCompliance(currentSystemPrompt, schema, error);
    return executeAttempt(attempt + 1, enhancedPrompt, currentOptions);
  } else if (error.message.includes('timeout') || error.message.includes('rate limit')) {
    // タイムアウトやレート制限の場合：温度を下げて安定化
    const adjustedOptions = { ...currentOptions, temperature: Math.max((currentOptions?.temperature ?? 0.3) * 0.8, 0.1) };
    return executeAttempt(attempt + 1, currentSystemPrompt, adjustedOptions);
  }
  
  return TE.left(error) as TE.TaskEither<Error, T>;
};

/**
 * 生成エラーの処理（関数型パターン）
 */
export const handleGenerationError = <T>(
  error: Error,
  attempt: number,
  currentSystemPrompt: string,
  currentOptions: GenerationOptions | undefined,
  maxRetries: number,
  enableAutoRecovery: boolean,
  schema: Schema,
  systemPrompt: string,
  userPrompt: string,
  providerName: string | undefined,
  options: GenerationOptions | undefined,
  executeAttempt: (attempt: number, systemPrompt: string, options: GenerationOptions | undefined) => TE.TaskEither<Error, T>,
  tryFallbackProviders: () => TE.TaskEither<Error, T>
): TE.TaskEither<Error, T> => {
  const err = error as Error;
  getLogger().warn('LLM generation attempt failed', {
    attempt,
    maxRetries,
    error: err.message
  });
  
  // 自動復旧機能：エラー内容に応じてプロンプトを調整
  if (enableAutoRecovery && attempt < maxRetries) {
    return handleAutoRecovery(
      err, 
      attempt, 
      currentSystemPrompt, 
      currentOptions, 
      schema, 
      systemPrompt, 
      userPrompt, 
      providerName, 
      options,
      executeAttempt
    );
  }
  
  if (attempt === maxRetries) {
    // 最終試行でも失敗した場合、フォールバックプロバイダーを試行
    return tryFallbackProviders();
  }
  
  return TE.left(err);
};
