/**
 * 各思考法の出力スキーマ定義
 */

import { z } from 'zod';
import { ThinkingMethodTypeSchema, ThinkingProcessStatusSchema } from './base.js';

// ============================================================================
// 各思考法の出力スキーマ
// ============================================================================

/**
 * アブダクション思考の出力スキーマ
 */
export const AbductionOutputSchema = z.object({
  hypotheses: z.array(z.object({
    explanation: z.string().describe('仮説の説明'),
    plausibility: z.number().min(0).max(1).describe('仮説の妥当性（0-1の数値）'),
    testablePredicitions: z.array(z.string()).describe('検証可能な予測の配列'),
  })).describe('生成された仮説の配列'),
  recommendedNext: z.array(ThinkingMethodTypeSchema).describe('次に推奨される思考法'),
  confidence: z.number().min(0).max(1).describe('信頼度（0-1の数値）'),
  reasoning: z.string().describe('推理過程'),
  status: ThinkingProcessStatusSchema.optional().describe('思考プロセスの状態')
});

/**
 * 批判的思考の出力スキーマ
 */
export const CriticalOutputSchema = z.object({
  questioningResults: z.object({
    questionValidity: z.array(z.string()).describe('妥当性に関する質問の配列'),
    logicalGaps: z.array(z.string()).describe('論理的ギャップの配列'),
    assumptionChallenges: z.array(z.string()).describe('仮定への挑戦の配列'),
    biases: z.array(z.string()).describe('バイアスの配列'),
  }).describe('批判的質問の結果'),
  strengthsWeaknesses: z.object({
    strengths: z.array(z.string()).describe('強みの配列'),
    weaknesses: z.array(z.string()).describe('弱みの配列'),
    missingEvidence: z.array(z.string()).describe('不足している証拠の配列'),
  }).describe('強みと弱みの分析'),
  recommendations: z.array(z.string()).describe('改善推奨事項の配列'),
  confidence: z.number().min(0).max(1).describe('信頼度（0-1の数値）'),
  reasoning: z.string().describe('推理過程'),
  status: ThinkingProcessStatusSchema.optional().describe('思考プロセスの状態')
});

/**
 * ディベート思考の出力スキーマ
 */
export const DebateOutputSchema = z.object({
  proposition: z.string().describe('論題'),
  proArguments: z.array(z.object({
    argument: z.string().describe('賛成論点'),
    evidence: z.array(z.string()).describe('根拠の配列'),
    strength: z.number().min(0).max(1).describe('論点の強さ（0-1の数値）'),
  })).describe('賛成論点の配列'),
  conArguments: z.array(z.object({
    argument: z.string().describe('反対論点'),
    evidence: z.array(z.string()).describe('根拠の配列'),
    strength: z.number().min(0).max(1).describe('論点の強さ（0-1の数値）'),
  })).describe('反対論点の配列'),
  keyDisputes: z.array(z.string()).describe('主要な争点の配列'),
  recommendation: z.object({
    decision: z.enum(['support', 'oppose', 'modify']).describe('最終的な判断'),
    reasoning: z.string().describe('判断の理由'),
    conditions: z.array(z.string()).optional().describe('条件の配列'),
  }).describe('推奨事項'),
  confidence: z.number().min(0).max(1).describe('信頼度（0-1の数値）'),
  reasoning: z.string().describe('推理過程'),
  status: ThinkingProcessStatusSchema.optional().describe('思考プロセスの状態')
});

/**
 * 演繹的思考の出力スキーマ
 */
export const DeductiveOutputSchema = z.object({
  conclusion: z.string().describe('演繹的推論の結論'),
  validityCheck: z.object({
    isValid: z.boolean().describe('論理の妥当性'),
    reasoning: z.string().describe('妥当性チェックの理由'),
    premiseReliability: z.number().min(0).max(1).describe('前提の信頼性（0-1の数値）'),
  }).describe('論理の妥当性チェック'),
  implications: z.array(z.string()).describe('結論から導かれる含意の配列'),
  confidence: z.number().min(0).max(1).describe('信頼度（0-1の数値）'),
  reasoning: z.string().describe('推理過程'),
  status: ThinkingProcessStatusSchema.optional().describe('思考プロセスの状態')
});

/**
 * 帰納的思考の出力スキーマ
 */
export const InductiveOutputSchema = z.object({
  generalizations: z.array(z.object({
    pattern: z.string().describe('発見されたパターンの説明'),
    confidence: z.number().min(0).max(1).describe('信頼度（0-1の数値）'),
    supportingEvidence: z.array(z.string()).describe('根拠となる観察データの配列'),
    exceptions: z.array(z.string()).optional().describe('例外となる観察データの配列'),
  })).describe('発見された一般化の配列'),
  sampleSize: z.number().describe('観察データの数'),
  biasWarnings: z.array(z.string()).optional().describe('バイアスや制限事項の配列'),
  confidence: z.number().min(0).max(1).describe('信頼度（0-1の数値）'),
  reasoning: z.string().describe('推理過程'),
  status: ThinkingProcessStatusSchema.optional().describe('思考プロセスの状態')
});

/**
 * ロジカルシンキングの出力スキーマ
 */
export const LogicalOutputSchema = z.object({
  conclusion: z.string().describe('論理的な結論'),
  reasoning: z.array(z.object({
    step: z.string().describe('推論のステップ'),
    evidence: z.array(z.string()).describe('根拠となる証拠'),
    inference: z.string().describe('推論の内容'),
  })).describe('論理的な推論プロセス'),
  pyramid: z.object({
    conclusion: z.string().describe('ピラミッド構造の結論'),
    supports: z.array(z.object({
      claim: z.string().describe('支持する主張'),
      evidence: z.array(z.string()).describe('根拠となる証拠'),
    })).describe('結論を支持する主張の配列'),
  }).describe('ピラミッド構造の論理構成'),
  confidence: z.number().min(0).max(1).describe('信頼度（0-1の数値）'),
  status: ThinkingProcessStatusSchema.optional().describe('思考プロセスの状態')
});

/**
 * MECE思考の出力スキーマ
 */
export const MECEOutputSchema = z.object({
  criteria: z.string().describe('分類に使用された基準'),
  categories: z.array(z.object({
    name: z.string().describe('カテゴリ名'),
    items: z.array(z.string()).describe('カテゴリに属する項目'),
    coverage: z.string().describe('カテゴリの範囲説明'),
  })).describe('分類されたカテゴリの配列'),
  gaps: z.array(z.string()).describe('分類で見つかったギャップ'),
  overlaps: z.array(z.string()).describe('分類で見つかった重複'),
  completenessScore: z.number().min(0).max(1).describe('分類の完全性スコア（0-1の数値）'),
  reasoning: z.string().describe('推理過程'),
  status: ThinkingProcessStatusSchema.optional().describe('思考プロセスの状態')
});

/**
 * メタ思考の出力スキーマ
 */
export const MetaOutputSchema = z.object({
  processEvaluation: z.object({
    currentProcess: z.array(z.string()).describe('現在の思考プロセスの配列'),
    effectiveness: z.number().min(0).max(1).describe('プロセスの有効性（0-1の数値）'),
    gaps: z.array(z.string()).describe('プロセスのギャップの配列'),
  }).describe('思考プロセスの評価'),
  recommendations: z.array(z.object({
    aspect: z.string().describe('改善対象の側面'),
    improvement: z.string().describe('改善提案'),
    priority: z.enum(['high', 'medium', 'low']).describe('優先度'),
  })).describe('改善推奨事項の配列'),
  alternativeApproaches: z.array(z.string()).describe('代替アプローチの配列'),
  confidence: z.number().min(0).max(1).describe('信頼度（0-1の数値）'),
  reasoning: z.string().describe('推理過程'),
  status: ThinkingProcessStatusSchema.optional().describe('思考プロセスの状態')
});

/**
 * PAC思考の出力スキーマ
 */
export const PACOutputSchema = z.object({
  premise: z.string().describe('前提'),
  assumption: z.string().describe('仮定'),
  conclusion: z.string().describe('結論'),
  assumptions_validity: z.object({
    isValid: z.boolean().describe('仮定の妥当性'),
    concerns: z.array(z.string()).describe('懸念事項の配列'),
    testMethods: z.array(z.string()).describe('検証方法の配列'),
  }).describe('仮定の妥当性チェック'),
  premise_validity: z.object({
    isReliable: z.boolean().describe('前提の信頼性'),
    biases: z.array(z.string()).describe('バイアスの配列'),
    verification_needed: z.array(z.string()).describe('検証が必要な項目の配列'),
  }).describe('前提の妥当性チェック'),
  confidence: z.number().min(0).max(1).describe('信頼度（0-1の数値）'),
  reasoning: z.string().describe('推理過程'),
  status: ThinkingProcessStatusSchema.optional().describe('思考プロセスの状態')
});

// ============================================================================
// 型エクスポート
// ============================================================================

export type AbductionOutput = z.infer<typeof AbductionOutputSchema>;
export type CriticalOutput = z.infer<typeof CriticalOutputSchema>;
export type DebateOutput = z.infer<typeof DebateOutputSchema>;
export type DeductiveOutput = z.infer<typeof DeductiveOutputSchema>;
export type InductiveOutput = z.infer<typeof InductiveOutputSchema>;
export type LogicalOutput = z.infer<typeof LogicalOutputSchema>;
export type MECEOutput = z.infer<typeof MECEOutputSchema>;
export type MetaOutput = z.infer<typeof MetaOutputSchema>;
export type PACOutput = z.infer<typeof PACOutputSchema>;
