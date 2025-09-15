import * as TE from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { getLogger } from './logger.js';
import { listProviders } from './llm-provider.js';
import type { GenerationOptions, Schema } from './types.js';

/**
 * フォールバックプロバイダーでの再試行（TaskEither型でエラーハンドリング）
 */
export const tryFallbackProvidersTaskEither = <T>(
  schema: Schema,
  systemPrompt: string,
  userPrompt: string,
  originalProviderName: string | undefined,
  options: GenerationOptions | undefined,
  generateStructuredOutputTaskEither: (
    schema: Schema,
    systemPrompt: string,
    userPrompt: string,
    providerName?: string,
    options?: GenerationOptions
  ) => TE.TaskEither<Error, T>
): TE.TaskEither<Error, T> => {
  const logger = getLogger();
  const availableProviders = listProviders();
  const fallbackProviders = availableProviders.filter(name => name !== originalProviderName);
  
  const tryProvider = (providerName: string): TE.TaskEither<Error, T> => {
    return pipe(
      TE.fromIO(() => logger.info(`Trying fallback provider: ${providerName}`)),
      TE.chain(() => generateStructuredOutputTaskEither(
        schema,
        systemPrompt,
        userPrompt,
        providerName,
        { ...options, temperature: 0.1 } // より保守的な設定
      )),
      TE.chainFirst(() => TE.fromIO(() => logger.info(`Fallback provider ${providerName} succeeded`)))
    );
  };

  const tryAllProviders = (providers: string[]): TE.TaskEither<Error, T> => {
    if (providers.length === 0) {
      return TE.left(new Error('All providers failed'));
    }

    const [firstProvider, ...restProviders] = providers;
    return pipe(
      tryProvider(firstProvider),
      TE.orElse(() => tryAllProviders(restProviders))
    );
  };

  return tryAllProviders(fallbackProviders);
};

/**
 * 複数プロバイダーでのフォールバック生成（TaskEither型でエラーハンドリング）
 */
export const generateWithFallbackTaskEither = <T>(
  schema: Schema,
  systemPrompt: string,
  userPrompt: string,
  options: GenerationOptions | undefined,
  generateStructuredOutputTaskEither: (
    schema: Schema,
    systemPrompt: string,
    userPrompt: string,
    providerName?: string,
    options?: GenerationOptions
  ) => TE.TaskEither<Error, T>
): TE.TaskEither<Error, T> => {
  const availableProviders = listProviders();
  
  const tryProvider = (providerName: string): TE.TaskEither<Error, T> => {
    return pipe(
      generateStructuredOutputTaskEither(schema, systemPrompt, userPrompt, providerName, options),
      TE.orElse(error => {
        getLogger().warn(`Provider ${providerName} failed:`, { error: (error as Error).message });
        return TE.left(error);
      })
    );
  };

  const tryAllProviders = (providers: string[]): TE.TaskEither<Error, T> => {
    if (providers.length === 0) {
      return TE.left(new Error('All providers failed'));
    }

    const [firstProvider, ...restProviders] = providers;
    return pipe(
      tryProvider(firstProvider),
      TE.orElse(() => tryAllProviders(restProviders))
    );
  };

  return tryAllProviders(availableProviders);
};
