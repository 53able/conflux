/**
 * Core モジュールのバレルファイル
 * 
 * このファイルは、Core関連のすべての機能を一箇所からエクスポートします。
 * 外部からのインポートを簡潔にし、モジュールの構造を明確にします。
 */

// エージェントベース
export * from './agent-base.js';

// 共通型定義
export * from './types.js';
export * from './validation-types.js';

// 共通定数
export * from './constants.js';

// 入力変換ユーティリティ
export * from './input-converter.js';


// LLMプロバイダー
export * from './llm-provider.js';

// LLM統合
export * from './llm-integration.js';

// LLM関連の分割されたモジュール
export * from './schema-utils.js';
export * from './generation-core.js';
export * from './error-recovery.js';
export * from './fallback-handlers.js';

// ロガー
export * from './logger.js';

// 型の再エクスポート
export type { Either } from 'fp-ts/lib/Either.js';
export type { Option } from 'fp-ts/lib/Option.js';
export type { TaskEither } from 'fp-ts/lib/TaskEither.js';
export type { Task } from 'fp-ts/lib/Task.js';

// グローバルLLMマネージャー
export { globalLLMManager } from './llm-provider.js';
