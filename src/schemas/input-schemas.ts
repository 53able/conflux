/**
 * 各思考法の入力スキーマ定義
 */

import { z } from 'zod';
import { BaseInputFieldsSchema } from './base.js';

// ============================================================================
// 各思考法の入力スキーマ
// ============================================================================

/**
 * アブダクション思考の入力スキーマ
 */
export const AbductionInputSchema = BaseInputFieldsSchema.extend({
  surprisingFact: z.string().min(1, '驚きの事実は必須です').describe('驚きの事実')
}).describe('アブダクション思考の入力スキーマ');

/**
 * 批判的思考の入力スキーマ
 */
export const CriticalInputSchema = BaseInputFieldsSchema.extend({
  claim: z.string().min(1, '主張は必須です').describe('主張'),
  evidence: z.array(z.string()).optional().describe('証拠')
}).describe('批判的思考の入力スキーマ');

/**
 * ディベート思考の入力スキーマ
 */
export const DebateInputSchema = BaseInputFieldsSchema.extend({
  topic: z.string().min(1, 'トピックは必須です').describe('トピック'),
  positions: z.array(z.string()).optional().describe('立場')
}).describe('ディベート思考の入力スキーマ');

/**
 * 演繹的思考の入力スキーマ
 */
export const DeductiveInputSchema = BaseInputFieldsSchema.extend({
  majorPremise: z.string().min(1, '大前提は必須です'),
  minorPremise: z.string().min(1, '小前提は必須です')
}).describe('演繹的思考の入力スキーマ');

/**
 * 帰納的思考の入力スキーマ
 */
export const InductiveInputSchema = BaseInputFieldsSchema.extend({
  observations: z.array(z.string()).min(1, '観察データは1つ以上必要です')
}).describe('帰納的思考の入力スキーマ');

/**
 * ロジカルシンキングの入力スキーマ
 */
export const LogicalInputSchema = BaseInputFieldsSchema.extend({
  question: z.string().min(1, '質問は必須です'),
  constraints: z.array(z.string()).optional()
}).describe('ロジカルシンキングの入力スキーマ');

/**
 * MECE思考の入力スキーマ
 */
export const MECEInputSchema = z.object({
  purpose: z.string().min(1, '目的は必須です'),
  items: z.array(z.string()).min(1, '項目は1つ以上必要です'),
  proposedCriteria: z.string().optional()
}).describe('MECE思考の入力スキーマ');

/**
 * メタ思考の入力スキーマ
 */
export const MetaInputSchema = BaseInputFieldsSchema.extend({
  currentThinking: z.string().min(1, '現在の思考内容は必須です'),
  objective: z.string().min(1, '目標は必須です')
}).describe('メタ思考の入力スキーマ');

/**
 * PAC思考の入力スキーマ
 */
export const PACInputSchema = BaseInputFieldsSchema.extend({
  claim: z.string().min(1, '主張は必須です')
}).describe('PAC思考の入力スキーマ');

// ============================================================================
// 型エクスポート
// ============================================================================

export type AbductionInput = z.infer<typeof AbductionInputSchema>;
export type CriticalInput = z.infer<typeof CriticalInputSchema>;
export type DebateInput = z.infer<typeof DebateInputSchema>;
export type DeductiveInput = z.infer<typeof DeductiveInputSchema>;
export type InductiveInput = z.infer<typeof InductiveInputSchema>;
export type LogicalInput = z.infer<typeof LogicalInputSchema>;
export type MECEInput = z.infer<typeof MECEInputSchema>;
export type MetaInput = z.infer<typeof MetaInputSchema>;
export type PACInput = z.infer<typeof PACInputSchema>;
