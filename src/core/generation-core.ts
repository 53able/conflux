import { generateText as aiGenerateText, generateObject } from 'ai';
import * as E from 'fp-ts/lib/Either.js';
import * as TE from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { getLogger } from './logger.js';
import { getProvider, type LanguageModel } from './llm-provider.js';
import type { GenerationOptions, ZodSchema, Schema } from './types.js';
import { isZodSchema, validateSchema } from './schema-utils.js';
import { handleGenerationError } from './error-recovery.js';
import { tryFallbackProvidersTaskEither } from './fallback-handlers.js';

/**
 * 構造化されたオブジェクト生成（TaskEither型でエラーハンドリング）
 */
export const generateStructuredOutputTaskEither = <T>(
  schema: Schema,
  systemPrompt: string,
  userPrompt: string,
  providerName?: string,
  options?: GenerationOptions
): TE.TaskEither<Error, T> => {
  const provider = getProvider(providerName);
  const maxRetries = options?.maxRetries || 3;
  const enableAutoRecovery = options?.enableAutoRecovery ?? true;
  
  const executeAttempt = (attempt: number, currentSystemPrompt: string, currentOptions: GenerationOptions | undefined): TE.TaskEither<Error, T> => {
    const generateObjectOptions = {
      model: provider as LanguageModel,
      schema: schema as ZodSchema,
      system: currentSystemPrompt,
      prompt: userPrompt,
      temperature: currentOptions?.temperature ?? 0.3,
      mode: currentOptions?.mode ?? 'auto',
      ...(currentOptions?.schemaName && { schemaName: currentOptions.schemaName }),
      ...(currentOptions?.schemaDescription && { schemaDescription: currentOptions.schemaDescription }),
    } as Parameters<typeof generateObject>[0];

    getLogger().debug('Executing LLM generation attempt', {
      attempt,
      maxRetries,
      provider: providerName,
      schemaName: currentOptions?.schemaName,
      temperature: currentOptions?.temperature,
      mode: currentOptions?.mode
    });

    return pipe(
      TE.tryCatch(() => generateObject(generateObjectOptions), (error) => error as Error),
      TE.chain((result: { object: unknown }): TE.TaskEither<Error, T> => {
        // スキーマ検証（Zodスキーマの場合）
        if (isZodSchema(schema)) {
          const validationResult = validateSchema(schema, result.object);
          if (E.isLeft(validationResult)) {
            const errors = validationResult.left;
            getLogger().error('Schema validation failed:', {
              generatedObject: result.object,
              validationErrors: errors,
              error: errors.map((err) => `${err.field}: ${err.message}`).join(', '),
              attempt,
              maxRetries
            });
            
            // 自動復旧が有効で、まだ試行回数に余裕がある場合
            if (enableAutoRecovery && attempt < maxRetries) {
              return handleGenerationError(
                new Error(`Schema validation failed: ${errors.map((err) => `${err.field}: ${err.message}`).join(', ')}`),
                attempt,
                currentSystemPrompt,
                currentOptions,
                maxRetries,
                enableAutoRecovery,
                schema,
                systemPrompt,
                userPrompt,
                providerName,
                options,
                executeAttempt,
                () => tryFallbackProvidersTaskEither(schema, systemPrompt, userPrompt, providerName, options, generateStructuredOutputTaskEither)
              ) as TE.TaskEither<Error, T>;
            }
            
            return TE.left(new Error(`Schema validation failed: ${errors.map((err) => `${err.field}: ${err.message}`).join(', ')}`));
          }
        }
        return TE.right(result.object as T);
      }),
      TE.orElse(error => handleGenerationError(
        error, 
        attempt, 
        currentSystemPrompt, 
        currentOptions, 
        maxRetries, 
        enableAutoRecovery, 
        schema, 
        systemPrompt, 
        userPrompt, 
        providerName, 
        options,
        executeAttempt,
        () => tryFallbackProvidersTaskEither(schema, systemPrompt, userPrompt, providerName, options, generateStructuredOutputTaskEither)
      ) as TE.TaskEither<Error, T>)
    ) as TE.TaskEither<Error, T>;
  };

  return executeAttempt(1, systemPrompt, options);
};

/**
 * テキスト生成（TaskEither型でエラーハンドリング）
 */
export const generateTextTaskEither = (
  systemPrompt: string,
  userPrompt: string,
  providerName?: string,
  options?: GenerationOptions
): TE.TaskEither<Error, string> => {
  const provider = getProvider(providerName);
  const maxRetries = options?.maxRetries || 3;
  
  const executeAttempt = (attempt: number): TE.TaskEither<Error, string> => {
    return pipe(
      TE.tryCatch(
        () => aiGenerateText({
          model: provider as LanguageModel,
          system: systemPrompt,
          prompt: userPrompt,
          temperature: options?.temperature ?? 0.3,
        }),
        (error) => error instanceof Error ? error : new Error(String(error))
      ),
      TE.map(result => result.text as string),
      TE.orElse(error => {
        const err = error as Error;
        getLogger().warn('Text generation attempt failed', {
          attempt,
          maxRetries,
          error: err.message
        });
        
        if (attempt === maxRetries) {
          return TE.left(err);
        }
        
        // 指数バックオフでリトライ
        return pipe(
          TE.fromTask(() => new Promise<void>(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))),
          TE.chain(() => executeAttempt(attempt + 1))
        );
      })
    );
  };

  return executeAttempt(1);
};

/**
 * プロバイダーのヘルスチェック（TaskEither型でエラーハンドリング）
 */
export const healthCheckTaskEither = (providerName?: string): TE.TaskEither<Error, boolean> => {
  return pipe(
    generateTextTaskEither(
      'You are a helpful assistant.',
      'Please respond with "OK" to confirm you are working.',
      providerName,
      { maxRetries: 1, temperature: 0.1 }
    ),
    TE.map((text: string) => text.toLowerCase().includes('ok'))
  );
};
