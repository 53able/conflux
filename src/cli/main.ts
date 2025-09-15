#!/usr/bin/env node

/**
 * CLIアプリケーション（関数型スタイル）
 */

import { Command } from 'commander';
import { getLogger } from '../core/index.js';
import * as E from 'fp-ts/lib/Either.js';
import * as TE from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { createProgram } from './parsers.js';
import { routeCommand } from './router.js';
import { displayError } from './display.js';
import { CLICommand } from './types.js';

/**
 * グローバルロガーインスタンス
 */
const logger = getLogger();

/**
 * コマンド実行関数
 */
async function executeCommand(command: CLICommand, args: string[], options: Record<string, unknown>): Promise<void> {
  const parsedArgs = {
    command,
    args,
    options: {
      verbose: Boolean(options.verbose) || false,
      debug: Boolean(options.debug) || false
    }
  };

  const result = await routeCommand(parsedArgs)();
  if (result._tag === 'Left') {
    displayError(result.left, Boolean(options.verbose));
    process.exit(1);
  }
}

/**
 * Commander.jsプログラムの設定
 */
function setupCommander(): Command {
  const program = createProgram();
  
  // 各コマンドにアクションハンドラーを設定
  program
    .command('phase <phase> <input>')
    .action(async (phase, input) => {
      await executeCommand('phase' as CLICommand, [phase, input], program.opts());
    });

  program
    .command('golden <input>')
    .action(async (input) => {
      await executeCommand('golden' as CLICommand, [input], program.opts());
    });

  program
    .command('method <method> <input>')
    .action(async (method, input) => {
      await executeCommand('method' as CLICommand, [method, input], program.opts());
    });

  program
    .command('strategy <strategy> <input>')
    .action(async (strategy, input) => {
      await executeCommand('strategy' as CLICommand, [strategy, input], program.opts());
    });

  program
    .command('list')
    .action(async () => {
      await executeCommand('list' as CLICommand, [], program.opts());
    });

  program
    .command('recommend <phase>')
    .action(async (phase) => {
      await executeCommand('recommend' as CLICommand, [phase], program.opts());
    });

  program
    .command('server')
    .action(async () => {
      await executeCommand('server' as CLICommand, [], program.opts());
    });

  return program;
}

/**
 * CLIのエントリーポイント（TaskEither型でエラーハンドリング）
 */
export const runCLITaskEither = (): TE.TaskEither<Error, void> => {
  return pipe(
    TE.fromIO(() => logger.info('ThinkingCLI initialized')),
    TE.chain(() => TE.tryCatch(
      async () => {
        const program = setupCommander();
        await program.parseAsync(process.argv);
      },
      (error) => error instanceof Error ? error : new Error('Unknown error')
    )),
    TE.mapLeft(error => {
      displayError(error.message, false);
      return error;
    })
  );
};

/**
 * CLIのエントリーポイント（後方互換性のため）
 */
export async function runCLI(): Promise<void> {
  const result = await runCLITaskEither()();
  return E.fold(
    (error: Error) => {
      displayError(error.message, false);
      process.exit(1);
    },
    () => {}
  )(result);
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI().catch((error) => {
    const logger = getLogger();
    logger.error('CLI execution failed:', error);
  });
}
