/**
 * CLI表示機能
 */

import { getLogger, colorize } from '../core/index.js';
import { type ThinkingResult, type IntegratedThinkingResult, type DevelopmentPhase } from '../schemas/index.js';
import { type ThinkingMethodInfo } from './types.js';

const logger = getLogger();

/**
 * 結果表示
 */
export function displayResult(result: ThinkingResult | IntegratedThinkingResult, verbose: boolean = false): void {
  logger.info('\n' + colorize('=== 思考結果 ===', 'cyan'));
  logger.info(JSON.stringify(result, null, 2));
  
  if (verbose) {
    logger.info('\n' + colorize('=== 詳細情報 ===', 'yellow'));
    logger.info(`実行時刻: ${new Date().toISOString()}`);
    logger.info(`結果タイプ: ${'integratedResults' in result ? 'Integrated' : 'Single'}`);
  }
}

/**
 * 思考法一覧表示
 */
export function displayThinkingMethods(methods: ThinkingMethodInfo[], verbose: boolean = false): void {
  logger.info('\n' + colorize('=== 利用可能な思考法 ===', 'cyan'));
  methods.forEach(method => {
    logger.info(`\n${colorize(method.name, 'green')}: ${method.description}`);
    if (verbose) {
      logger.info(`  適用局面: ${method.applicablePhases.join(', ')}`);
    }
  });
}

/**
 * 推奨思考法表示
 */
export function displayRecommendations(phase: DevelopmentPhase, recommendations: string[], verbose: boolean = false): void {
  logger.info('\n' + colorize(`=== ${phase} の推奨思考法 ===`, 'cyan'));
  if (recommendations.length > 0) {
    recommendations.forEach((method, index) => {
      logger.info(`${index + 1}. ${colorize(method, 'green')}`);
    });
  } else {
    logger.info('推奨思考法はありません');
  }
  
  if (verbose) {
    logger.info(`\n局面: ${phase}`);
    logger.info(`推奨数: ${recommendations.length}`);
  }
}

/**
 * エラー表示
 */
export function displayError(error: string, verbose: boolean = false): void {
  logger.error('\n' + colorize('エラー:', 'red'));
  logger.error(error);
      
  if (verbose) {
    logger.error('\n' + colorize('詳細情報:', 'yellow'));
    logger.error(`エラー時刻: ${new Date().toISOString()}`);
    logger.error(`エラータイプ: CLI Error`);
  }
}
