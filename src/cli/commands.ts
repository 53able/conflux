/**
 * CLIコマンドハンドラー
 */

import { type TaskEither, getLogger, globalLLMManager, toLanguageModel } from '../core/index.js';
import * as TE from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { processSingleMethodTaskEither, processCustomStrategy, processPhaseTaskEither, processGoldenPatternTaskEither } from '../orchestrator/index.js';
import { createThinkingMethodsMCPServer } from '../mcp/index.js';
import { type CLIOptions } from './types.js';
import { type DevelopmentPhase, type ThinkingMethodType } from '../schemas/index.js';
import { parsePhaseArguments, parseGoldenArguments, parseMethodArguments, parseStrategyArguments, parseRecommendArguments } from './parsers.js';
import { getThinkingMethodsList, getPhaseRecommendations } from './data.js';
import { displayResult, displayThinkingMethods, displayRecommendations } from './display.js';

/**
 * 局面別思考プロセス実行
 */
export function handlePhaseCommand(
  args: string[], 
  options: CLIOptions
): TaskEither<string, void> {
  return pipe(
    parsePhaseArguments(args),
    TE.chain(({ phase, input }) => {
      const context = {
        llmProvider: toLanguageModel(globalLLMManager.getProvider()),
        llmIntegration: globalLLMManager.getIntegration(),
        userId: 'cli-user',
        sessionId: `phase-${Date.now()}`,
      };

      return pipe(
        processPhaseTaskEither(phase as DevelopmentPhase, input, context),
        TE.mapLeft((error: string) => `Phase processing failed: ${error}`),
        TE.map((result) => {
          displayResult(result, options.verbose);
        })
      );
    })
  );
}

/**
 * 黄金パターン実行
 */
export function handleGoldenCommand(
  args: string[], 
  options: CLIOptions
): TaskEither<string, void> {
  return pipe(
    parseGoldenArguments(args),
    TE.chain((input) => {
      const context = {
        llmProvider: toLanguageModel(globalLLMManager.getProvider()),
        llmIntegration: globalLLMManager.getIntegration(),
        userId: 'cli-user',
        sessionId: `golden-${Date.now()}`,
      };

      return pipe(
        processGoldenPatternTaskEither(input, context),
        TE.mapLeft((error: string) => `Golden pattern processing failed: ${error}`),
        TE.map((result) => {
          displayResult(result, options.verbose);
        })
      );
    })
  );
}

/**
 * 単一思考法実行
 */
export function handleMethodCommand(
  args: string[], 
  options: CLIOptions
): TaskEither<string, void> {
  return pipe(
    parseMethodArguments(args),
    TE.chain(({ method, input }) => {
      const context = {
        llmProvider: toLanguageModel(globalLLMManager.getProvider()),
        llmIntegration: globalLLMManager.getIntegration(),
        userId: 'cli-user',
        sessionId: `method-${Date.now()}`,
      };

      return pipe(
        processSingleMethodTaskEither(method as ThinkingMethodType, input, context),
        TE.map((result) => {
          displayResult(result, options.verbose);
        }),
        TE.mapLeft((error) => `Method processing failed: ${error}`)
      );
    })
  );
}

/**
 * カスタム戦略実行
 */
export function handleStrategyCommand(
  args: string[], 
  options: CLIOptions
): TaskEither<string, void> {
  return pipe(
    parseStrategyArguments(args),
    TE.chain(({ strategy, input }) => {
      const context = {
        llmProvider: toLanguageModel(globalLLMManager.getProvider()),
        llmIntegration: globalLLMManager.getIntegration(),
        userId: 'cli-user',
        sessionId: `strategy-${Date.now()}`,
      };

      return pipe(
        TE.tryCatch(
          () => processCustomStrategy(strategy, input, context),
          (error: unknown) => `Strategy processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        ),
        TE.map((result) => {
          displayResult(result, options.verbose);
        })
      );
    })
  );
}

/**
 * 思考法一覧表示
 */
export function handleListCommand(
  args: string[], 
  options: CLIOptions
): TaskEither<string, void> {
  return pipe(
    getThinkingMethodsList(),
    TE.map((methods) => {
      displayThinkingMethods(methods, options.verbose);
    })
  );
}

/**
 * 局面別推奨思考法表示
 */
export function handleRecommendCommand(
  args: string[], 
  options: CLIOptions
): TaskEither<string, void> {
  return pipe(
    parseRecommendArguments(args),
    TE.map((phase) => {
      const recommendations = getPhaseRecommendations(phase);
      displayRecommendations(phase, recommendations, options.verbose);
    })
  );
}

/**
 * MCPサーバー起動
 */
export function handleServerCommand(
  _args: string[], 
  _options: CLIOptions
): TaskEither<string, void> {
  return pipe(
    TE.tryCatch(
      async () => {
        const _server = createThinkingMethodsMCPServer();
        // MCPサーバーは自動的に開始されるため、手動でstartを呼ぶ必要はない
        getLogger().info('Functional MCP server created');
      },
      (error) => `Functional server start failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    ),
    TE.map(() => {})
  );
}
