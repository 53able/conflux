import { z } from 'zod';
import { 
  ThinkingMethodType, 
  DevelopmentPhase,
  AbductionInputSchema,
  CriticalInputSchema,
  DebateInputSchema,
  DeductiveInputSchema,
  InductiveInputSchema,
  LogicalInputSchema,
  MECEInputSchema,
  MetaInputSchema,
  PACInputSchema
} from '../schemas/index.js';

/**
 * 思考法固有の入力データのユニオン型
 */
const ThinkingMethodInputSchema = z.union([
  AbductionInputSchema,
  CriticalInputSchema,
  DebateInputSchema,
  DeductiveInputSchema,
  InductiveInputSchema,
  LogicalInputSchema,
  MECEInputSchema,
  MetaInputSchema,
  PACInputSchema
]);

/**
 * MCPツールの入力スキーマ定義
 */
export const ProcessPhaseInputSchema = z.object({
  phase: DevelopmentPhase,
  input: z.union([
    ThinkingMethodInputSchema,
    z.record(z.string(), z.unknown())
  ]).describe('分析対象の入力データ（思考法固有の構造または任意のオブジェクト）'),
  llmProvider: z.string().optional().describe('LLMプロバイダー設定'),
  userId: z.string().optional().describe('ユーザーID')
});

export const ProcessGoldenPatternInputSchema = z.object({
  input: z.union([
    ThinkingMethodInputSchema,
    z.record(z.string(), z.unknown())
  ]).describe('分析対象の入力データ（思考法固有の構造または任意のオブジェクト）'),
  llmProvider: z.string().optional().describe('LLMプロバイダー設定'),
  userId: z.string().optional().describe('ユーザーID')
});

export const ProcessSingleMethodInputSchema = z.object({
  method: ThinkingMethodType,
  input: z.union([
    ThinkingMethodInputSchema,
    z.record(z.string(), z.unknown())
  ]).describe('分析対象の入力データ（思考法固有の構造または任意のオブジェクト）'),
  llmProvider: z.string().optional().describe('LLMプロバイダー設定'),
  userId: z.string().optional().describe('ユーザーID')
});

export const ProcessCustomStrategyInputSchema = z.object({
  primary: ThinkingMethodType.describe('主要思考法'),
  secondary: z.array(ThinkingMethodType).describe('併用思考法'),
  sequence: z.array(ThinkingMethodType).min(1).describe('実行する思考法の順序'),
  input: z.union([
    ThinkingMethodInputSchema,
    z.record(z.string(), z.unknown())
  ]).describe('分析対象の入力データ（思考法固有の構造または任意のオブジェクト）'),
  llmProvider: z.string().optional().describe('LLMプロバイダー設定'),
  userId: z.string().optional().describe('ユーザーID')
});

export const PhaseRecommendationsInputSchema = z.object({
  phase: DevelopmentPhase,
});
