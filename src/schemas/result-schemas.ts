/**
 * 思考結果と統合結果のスキーマ定義
 */

import { z } from 'zod';
import { ThinkingMethodTypeSchema, DevelopmentPhaseSchema, ThinkingProcessStatusSchema } from './base.js';

// ============================================================================
// 統合スキーマ
// ============================================================================

/**
 * 思考結果のスキーマ
 */
export const ThinkingResultSchema = z.object({
  method: ThinkingMethodTypeSchema,
  input: z.record(z.string(), z.unknown()),
  output: z.record(z.string(), z.unknown()).optional(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  status: ThinkingProcessStatusSchema,
  timestamp: z.string(),
  nextRecommendations: z.array(ThinkingMethodTypeSchema).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

/**
 * 統合思考結果のスキーマ
 */
export const IntegratedThinkingResultSchema = z.object({
  phase: DevelopmentPhaseSchema,
  primaryMethod: ThinkingMethodTypeSchema,
  secondaryMethods: z.array(ThinkingMethodTypeSchema),
  results: z.array(ThinkingResultSchema),
  synthesis: z.string(),
  actionItems: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  nextSteps: z.array(z.string()),
  timestamp: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

// ============================================================================
// 型エクスポート
// ============================================================================

export type ThinkingResult = z.infer<typeof ThinkingResultSchema>;
export type IntegratedThinkingResult = z.infer<typeof IntegratedThinkingResultSchema>;
