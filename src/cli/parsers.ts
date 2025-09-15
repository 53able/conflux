/**
 * CLI引数解析機能（Commander.js統合）
 */

import { Command } from 'commander';
import { type TaskEither } from '../core/index.js';
import * as E from 'fp-ts/lib/Either.js';
import * as TE from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { type ParsedArguments, type PhaseArguments, type MethodArguments, type StrategyArguments, ParsedArguments as ParsedArgumentsSchema, PhaseArguments as PhaseArgumentsSchema, MethodArguments as MethodArgumentsSchema, StrategyArguments as StrategyArgumentsSchema } from './types.js';
import { DevelopmentPhase } from '../schemas/index.js';

/**
 * Commander.jsプログラムの設定
 */
export function createProgram(): Command {
  const program = new Command();
  
  program
    .name('thinking-cli')
    .description('Multi-agent thinking methodology CLI')
    .version('1.0.0')
    .option('-v, --verbose', '詳細出力')
    .option('--debug', 'デバッグモード');

  // サブコマンドの定義
  program
    .command('phase <phase> <input>')
    .description('局面別思考プロセス実行')
    .action((_phase, _input) => {
      // アクションは後で処理
    });

  program
    .command('golden <input>')
    .description('黄金パターン実行')
    .action((_input) => {
      // アクションは後で処理
    });

  program
    .command('method <method> <input>')
    .description('単一思考法実行')
    .action((_method, _input) => {
      // アクションは後で処理
    });

  program
    .command('strategy <strategy> <input>')
    .description('カスタム戦略実行')
    .action((_strategy, _input) => {
      // アクションは後で処理
    });

  program
    .command('list')
    .description('思考法一覧表示')
    .action(() => {
      // アクションは後で処理
    });

  program
    .command('recommend <phase>')
    .description('局面別推奨思考法表示')
    .action((_phase) => {
      // アクションは後で処理
    });

  program
    .command('server')
    .description('MCPサーバー起動')
    .action(() => {
      // アクションは後で処理
    });

  return program;
}

/**
 * メイン引数の解析（Commander.js使用 + Zodバリデーション）
 */
export function parseArguments(): TaskEither<string, ParsedArguments> {
  return pipe(
    E.tryCatch(
      () => {
        const program = createProgram();
        const parsed = program.parse(process.argv, { from: 'node' });
        
        // コマンド名と引数を抽出
        const commandName = parsed.args[0] || 'help';
        const args = parsed.args.slice(1);
        const options = parsed.opts() as { verbose?: boolean; debug?: boolean };
        
        return {
          command: commandName,
          args,
          options: {
            verbose: options.verbose || false,
            debug: options.debug || false
          }
        };
      },
      (error) => `Argument parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    ),
    TE.fromEither,
    TE.chain((rawArgs) => {
      // Zodスキーマでバリデーション
      const result = ParsedArgumentsSchema.safeParse(rawArgs);
      if (result.success) {
        return TE.right(result.data);
      } else {
        return TE.left(`Validation failed: ${result.error.message}`);
      }
    })
  );
}

/**
 * 局面別引数の解析（Zodバリデーション付き）
 */
export function parsePhaseArguments(args: string[]): TaskEither<string, PhaseArguments> {
  return pipe(
    E.tryCatch(
      () => {
        if (args.length < 2) {
          throw new Error('Usage: phase <phase> <input>');
        }
        
        const phase = args[0];
        const input = JSON.parse(args[1]);
        
        return { phase, input };
      },
      (error) => `Phase argument parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    ),
    TE.fromEither,
    TE.chain((rawArgs) => {
      // Zodスキーマでバリデーション
      const result = PhaseArgumentsSchema.safeParse(rawArgs);
      if (result.success) {
        return TE.right(result.data);
      } else {
        return TE.left(`Phase validation failed: ${result.error.message}`);
      }
    })
  );
}

/**
 * 黄金パターン引数の解析
 */
export function parseGoldenArguments(args: string[]): TaskEither<string, Record<string, unknown>> {
  return pipe(
    E.tryCatch(
      () => {
        if (args.length < 1) {
          throw new Error('Usage: golden <input>');
        }
        
        return JSON.parse(args[0]);
      },
      (error) => `Golden argument parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    ),
    TE.fromEither
  );
}

/**
 * 単一思考法引数の解析（Zodバリデーション付き）
 */
export function parseMethodArguments(args: string[]): TaskEither<string, MethodArguments> {
  return pipe(
    E.tryCatch(
      () => {
        if (args.length < 2) {
          throw new Error('Usage: method <method> <input>');
        }
        
        const method = args[0];
        const input = JSON.parse(args[1]);
        
        return { method, input };
      },
      (error) => `Method argument parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    ),
    TE.fromEither,
    TE.chain((rawArgs) => {
      // Zodスキーマでバリデーション
      const result = MethodArgumentsSchema.safeParse(rawArgs);
      if (result.success) {
        return TE.right(result.data);
      } else {
        return TE.left(`Method validation failed: ${result.error.message}`);
      }
    })
  );
}

/**
 * カスタム戦略引数の解析（Zodバリデーション付き）
 */
export function parseStrategyArguments(args: string[]): TaskEither<string, StrategyArguments> {
  return pipe(
    E.tryCatch(
      () => {
        if (args.length < 2) {
          throw new Error('Usage: strategy <strategy> <input>');
        }
        
        const strategy = JSON.parse(args[0]);
        const input = JSON.parse(args[1]);
        
        return { strategy, input };
      },
      (error) => `Strategy argument parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    ),
    TE.fromEither,
    TE.chain((rawArgs) => {
      // Zodスキーマでバリデーション
      const result = StrategyArgumentsSchema.safeParse(rawArgs);
      if (result.success) {
        return TE.right(result.data);
      } else {
        return TE.left(`Strategy validation failed: ${result.error.message}`);
      }
    })
  );
}

/**
 * 推奨思考法引数の解析（Zodバリデーション付き）
 */
export function parseRecommendArguments(args: string[]): TaskEither<string, DevelopmentPhase> {
  return pipe(
    E.tryCatch(
      () => {
        if (args.length < 1) {
          throw new Error('Usage: recommend <phase>');
        }
        
        return args[0];
      },
      (error) => `Recommend argument parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    ),
    TE.fromEither,
    TE.chain((phase) => {
      // Zodスキーマでバリデーション
      const result = DevelopmentPhase.safeParse(phase);
      if (result.success) {
        return TE.right(result.data);
      } else {
        return TE.left(`Phase validation failed: ${result.error.message}`);
      }
    })
  );
}
