import { z } from 'zod';

/**
 * 思考法の種類を定義
 * 思考法の使い方.mdから抽出した9つの思考法
 */
export const ThinkingMethodType = z.enum([
  'abduction',          // アブダクション
  'logical',            // ロジカルシンキング
  'deductive',          // 演繹的思考
  'inductive',          // 帰納的思考
  'mece',               // MECE
  'pac',                // PAC思考
  'meta',               // メタ思考
  'debate',             // ディベート思考
  'critical',           // クリティカルシンキング
] as const);

export type ThinkingMethodType = z.infer<typeof ThinkingMethodType>;

/**
 * 開発の局面を定義
 * 思考法の使い方.mdの早見表から抽出
 */
export const DevelopmentPhase = z.enum([
  'business_exploration',    // 事業/課題の探索
  'requirement_definition',  // 要件定義
  'value_hypothesis',        // 価値仮説の妥当性確認
  'architecture_design',     // アーキ設計
  'prioritization',          // 優先順位付け
  'estimation_planning',     // 見積もり/計画
  'implementation',          // 実装（新機能）
  'debugging',              // デバッグ/障害対応
  'refactoring',            // リファクタリング
  'code_review',            // コードレビュー
  'test_design',            // テスト設計
  'experimentation',        // 実験/ABテスト
  'decision_making',        // 意思決定が割れる論点
  'retrospective',          // ふりかえり/改善
  'hypothesis_breakdown',   // 仮説の分解・検証計画
] as const);

export type DevelopmentPhase = z.infer<typeof DevelopmentPhase>;

/**
 * 思考プロセスの状態
 */
export const ThinkingProcessStatus = z.enum([
  'pending',      // 待機中
  'in_progress',  // 進行中
  'completed',    // 完了
  'failed',       // 失敗
] as const);

export type ThinkingProcessStatus = z.infer<typeof ThinkingProcessStatus>;

/**
 * 思考の結果
 */
export const ThinkingResult = z.object({
  method: ThinkingMethodType.describe('使用された思考法'),
  status: ThinkingProcessStatus.describe('思考プロセスの状態'),
  input: z.record(z.string(), z.unknown()).describe('思考の入力データ'),
  output: z.record(z.string(), z.unknown()).optional().describe('思考の出力結果'),
  confidence: z.number().min(0).max(1).describe('結果の信頼度（0-1の数値）'),
  reasoning: z.string().describe('思考プロセスの説明'),
  nextRecommendations: z.array(ThinkingMethodType).optional().describe('次に推奨される思考法'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('追加のメタデータ'),
});

export type ThinkingResult = z.infer<typeof ThinkingResult>;

/**
 * アブダクション思考の入力
 */
export const AbductionInput = z.object({
  surprisingFact: z.string().describe('驚くべき事実'),
  context: z.string().optional().describe('コンテキスト情報'),
  domain: z.string().optional().describe('対象ドメイン'),
});

export type AbductionInput = z.infer<typeof AbductionInput>;

/**
 * アブダクション思考の出力
 */
export const AbductionOutput = z.object({
  hypotheses: z.array(z.object({
    explanation: z.string().describe('仮説の説明'),
    plausibility: z.number().min(0).max(1).describe('仮説の妥当性（0-1の数値）'),
    testablePredicitions: z.array(z.string()).describe('検証可能な予測の配列'),
  })).describe('生成された仮説の配列'),
  recommendedNext: z.array(ThinkingMethodType).describe('次に推奨される思考法'),
});

export type AbductionOutput = z.infer<typeof AbductionOutput>;

/**
 * ロジカルシンキング思考の入力
 */
export const LogicalInput = z.object({
  question: z.string().describe('論点・問い'),
  information: z.array(z.string()).optional().describe('既知の情報'),
  constraints: z.array(z.string()).optional().describe('制約条件'),
});

export type LogicalInput = z.infer<typeof LogicalInput>;

/**
 * ロジカルシンキング思考の出力
 */
export const LogicalOutput = z.object({
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
});

export type LogicalOutput = z.infer<typeof LogicalOutput>;

/**
 * 演繹的思考の入力
 */
export const DeductiveInput = z.object({
  majorPremise: z.string().describe('大前提'),
  minorPremise: z.string().describe('小前提'),
  domain: z.string().optional().describe('適用領域'),
});

export type DeductiveInput = z.infer<typeof DeductiveInput>;

/**
 * 演繹的思考の出力
 */
export const DeductiveOutput = z.object({
  conclusion: z.string().describe('演繹的推論の結論'),
  validityCheck: z.object({
    isValid: z.boolean().describe('論理の妥当性'),
    reasoning: z.string().describe('妥当性チェックの理由'),
    premiseReliability: z.number().min(0).max(1).describe('前提の信頼性（0-1の数値）'),
  }).describe('論理の妥当性チェック'),
  implications: z.array(z.string()).describe('結論から導かれる含意の配列'),
});

export type DeductiveOutput = z.infer<typeof DeductiveOutput>;

/**
 * 帰納的思考の入力
 */
export const InductiveInput = z.object({
  observations: z.array(z.string()).describe('観測されたサンプル'),
  context: z.string().optional().describe('コンテキスト'),
});

export type InductiveInput = z.infer<typeof InductiveInput>;

/**
 * 帰納的思考の出力
 */
export const InductiveOutput = z.object({
  generalizations: z.array(z.object({
    pattern: z.string().describe('発見されたパターンの説明'),
    confidence: z.number().min(0).max(1).describe('信頼度（0-1の数値）'),
    supportingEvidence: z.array(z.string()).describe('根拠となる観察データの配列'),
    exceptions: z.array(z.string()).optional().describe('例外となる観察データの配列'),
  })).describe('発見された一般化の配列'),
  sampleSize: z.number().describe('観察データの数'),
  biasWarnings: z.array(z.string()).optional().describe('バイアスや制限事項の配列'),
});

export type InductiveOutput = z.infer<typeof InductiveOutput>;

/**
 * MECE思考の入力
 */
export const MECEInput = z.object({
  purpose: z.string().describe('情報収集の目的'),
  items: z.array(z.string()).describe('分類対象項目'),
  proposedCriteria: z.string().optional().describe('提案分類基準'),
});

export type MECEInput = z.infer<typeof MECEInput>;

/**
 * MECE思考の出力
 */
export const MECEOutput = z.object({
  criteria: z.string().describe('分類に使用された基準'),
  categories: z.array(z.object({
    name: z.string().describe('カテゴリ名'),
    items: z.array(z.string()).describe('カテゴリに属する項目'),
    coverage: z.string().describe('カテゴリの範囲説明'),
  })).describe('分類されたカテゴリの配列'),
  gaps: z.array(z.string()).describe('分類で見つかったギャップ'),
  overlaps: z.array(z.string()).describe('分類で見つかった重複'),
  completenessScore: z.number().min(0).max(1).describe('分類の完全性スコア（0-1の数値）'),
});

export type MECEOutput = z.infer<typeof MECEOutput>;

/**
 * PAC思考の入力
 */
export const PACInput = z.object({
  claim: z.string().describe('主張・結論'),
  context: z.string().optional().describe('コンテキスト'),
});

export type PACInput = z.infer<typeof PACInput>;

/**
 * PAC思考の出力
 */
export const PACOutput = z.object({
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
});

export type PACOutput = z.infer<typeof PACOutput>;

/**
 * メタ思考の入力
 */
export const MetaInput = z.object({
  currentThinking: z.string().describe('現在の思考内容'),
  objective: z.string().describe('目的'),
});

export type MetaInput = z.infer<typeof MetaInput>;

/**
 * メタ思考の出力
 */
export const MetaOutput = z.object({
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
});

export type MetaOutput = z.infer<typeof MetaOutput>;

/**
 * ディベート思考の入力
 */
export const DebateInput = z.object({
  proposition: z.string().describe('論題（〇〇すべき形式）'),
  context: z.string().optional().describe('背景情報'),
});

export type DebateInput = z.infer<typeof DebateInput>;

/**
 * ディベート思考の出力
 */
export const DebateOutput = z.object({
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
});

export type DebateOutput = z.infer<typeof DebateOutput>;

/**
 * クリティカル思考の入力
 */
export const CriticalInput = z.object({
  claim: z.string().describe('主張・結論'),
  evidence: z.array(z.string()).optional().describe('根拠'),
  context: z.string().optional().describe('コンテキスト'),
});

export type CriticalInput = z.infer<typeof CriticalInput>;

/**
 * クリティカル思考の出力
 */
export const CriticalOutput = z.object({
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
});

export type CriticalOutput = z.infer<typeof CriticalOutput>;

/**
 * 思考プロセス全体の統合結果
 */
export const IntegratedThinkingResult = z.object({
  phase: DevelopmentPhase.describe('開発の局面'),
  primaryMethod: ThinkingMethodType.describe('主要な思考法'),
  secondaryMethods: z.array(ThinkingMethodType).describe('補助的な思考法の配列'),
  results: z.array(ThinkingResult).describe('各思考法の結果の配列'),
  synthesis: z.string().describe('統合された思考結果の要約'),
  actionItems: z.array(z.string()).describe('実行すべきアクションアイテムの配列'),
  confidence: z.number().min(0).max(1).describe('統合結果の信頼度（0-1の数値）'),
  nextSteps: z.array(z.string()).describe('次のステップの配列'),
});

export type IntegratedThinkingResult = z.infer<typeof IntegratedThinkingResult>;
