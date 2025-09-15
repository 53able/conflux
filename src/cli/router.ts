/**
 * CLIコマンドルーティング
 */

import { type TaskEither } from '../core/index.js';
import * as TE from 'fp-ts/lib/TaskEither.js';
import { type ParsedArguments } from './types.js';
import {
  handlePhaseCommand,
  handleGoldenCommand,
  handleMethodCommand,
  handleStrategyCommand,
  handleListCommand,
  handleRecommendCommand,
  handleServerCommand
} from './commands.js';

/**
 * コマンドのルーティング
 */
export function routeCommand(
  parsed: ParsedArguments
): TaskEither<string, void> {
  switch (parsed.command) {
    case 'phase':
      return handlePhaseCommand(parsed.args, parsed.options);
    case 'golden':
      return handleGoldenCommand(parsed.args, parsed.options);
    case 'method':
      return handleMethodCommand(parsed.args, parsed.options);
    case 'strategy':
      return handleStrategyCommand(parsed.args, parsed.options);
    case 'list':
      return handleListCommand(parsed.args, parsed.options);
    case 'recommend':
      return handleRecommendCommand(parsed.args, parsed.options);
    case 'server':
      return handleServerCommand(parsed.args, parsed.options);
    case 'help':
    default:
      // Commander.jsの組み込みヘルプ機能を使用
      return TE.right(undefined);
  }
}
