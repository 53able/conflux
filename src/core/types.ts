/**
 * 共通型定義（Single Source of Truth）
 * 
 * このファイルは、プロジェクト全体で使用される共通の型定義を一元管理します。
 * 重複を避け、一貫性を保つために、すべての型定義はここから参照してください。
 */

import { z } from 'zod';

// ============================================================================
// LLM関連の型定義
// ============================================================================

/**
 * 生成オプションの型定義
 * LLM呼び出し時の共通パラメータを定義
 */
export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
  enableAutoRecovery?: boolean;
  mode?: 'auto' | 'json' | 'tool';
  schemaName?: string;
  schemaDescription?: string;
}

/**
 * Zodスキーマの型定義
 */
export type ZodSchema = z.ZodSchema<unknown>;

/**
 * スキーマの型定義（ZodSchemaとの互換性を保つ）
 */
export type Schema = z.ZodType<unknown> | z.ZodSchema<unknown>;
