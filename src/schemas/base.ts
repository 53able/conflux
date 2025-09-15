/**
 * 基本型と共通フィールドのスキーマ定義
 */

import { z } from 'zod';

// ============================================================================
// 基本型のスキーマ
// ============================================================================

/**
 * 思考法の種類のスキーマ
 */
export const ThinkingMethodTypeSchema = z.enum([
  'abduction',
  'critical',
  'debate',
  'deductive',
  'inductive',
  'logical',
  'mece',
  'meta',
  'pac'
]);

/**
 * 開発局面のスキーマ
 */
export const DevelopmentPhaseSchema = z.enum([
  'business_exploration',
  'requirement_definition',
  'value_hypothesis',
  'architecture_design',
  'prioritization',
  'estimation_planning',
  'implementation',
  'debugging',
  'refactoring',
  'code_review',
  'test_design',
  'experimentation',
  'decision_making',
  'retrospective',
  'hypothesis_breakdown'
]);

/**
 * 思考プロセス状態のスキーマ
 */
export const ThinkingProcessStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'failed'
]);

// ============================================================================
// 共通フィールドのスキーマ
// ============================================================================

/**
 * 基本入力フィールドのスキーマ
 */
export const BaseInputFieldsSchema = z.object({
  context: z.string().optional().describe('思考のコンテキスト'),
  domain: z.string().optional().describe('思考のドメイン'),
});

/**
 * 基本出力フィールドのスキーマ
 */
export const BaseOutputFieldsSchema = z.object({
  confidence: z.number().min(0).max(1).describe('思考の確信度'),
  reasoning: z.string().describe('思考の理由'),
  status: ThinkingProcessStatusSchema.optional().default('completed'),
});

// ============================================================================
// 型エクスポート
// ============================================================================

export type ThinkingMethodType = z.infer<typeof ThinkingMethodTypeSchema>;
export type DevelopmentPhase = z.infer<typeof DevelopmentPhaseSchema>;
export type ThinkingProcessStatus = z.infer<typeof ThinkingProcessStatusSchema>;

// 値としても使用できるように再エクスポート
export { ThinkingMethodTypeSchema as ThinkingMethodType };
export { DevelopmentPhaseSchema as DevelopmentPhase };
export { ThinkingProcessStatusSchema as ThinkingProcessStatus };
