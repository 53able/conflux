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
  method: ThinkingMethodType,
  status: ThinkingProcessStatus,
  input: z.record(z.string(), z.unknown()),
  output: z.record(z.string(), z.unknown()).optional(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  nextRecommendations: z.array(ThinkingMethodType).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
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
    explanation: z.string(),
    plausibility: z.number().min(0).max(1),
    testablePredicitions: z.array(z.string()),
  })),
  recommendedNext: z.array(ThinkingMethodType),
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
  conclusion: z.string(),
  reasoning: z.array(z.object({
    step: z.string(),
    evidence: z.array(z.string()),
    inference: z.string(),
  })),
  pyramid: z.object({
    conclusion: z.string(),
    supports: z.array(z.object({
      claim: z.string(),
      evidence: z.array(z.string()),
    })),
  }),
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
  conclusion: z.string(),
  validityCheck: z.object({
    isValid: z.boolean(),
    reasoning: z.string(),
    premiseReliability: z.number().min(0).max(1),
  }),
  implications: z.array(z.string()),
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
    pattern: z.string(),
    confidence: z.number().min(0).max(1),
    supportingEvidence: z.array(z.string()),
    exceptions: z.array(z.string()).optional(),
  })),
  sampleSize: z.number(),
  biasWarnings: z.array(z.string()).optional(),
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
  criteria: z.string(),
  categories: z.array(z.object({
    name: z.string(),
    items: z.array(z.string()),
    coverage: z.string(),
  })),
  gaps: z.array(z.string()),
  overlaps: z.array(z.string()),
  completenessScore: z.number().min(0).max(1),
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
  premise: z.string(),
  assumption: z.string(),
  conclusion: z.string(),
  assumptions_validity: z.object({
    isValid: z.boolean(),
    concerns: z.array(z.string()),
    testMethods: z.array(z.string()),
  }),
  premise_validity: z.object({
    isReliable: z.boolean(),
    biases: z.array(z.string()),
    verification_needed: z.array(z.string()),
  }),
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
    currentProcess: z.array(z.string()),
    effectiveness: z.number().min(0).max(1),
    gaps: z.array(z.string()),
  }),
  recommendations: z.array(z.object({
    aspect: z.string(),
    improvement: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
  })),
  alternativeApproaches: z.array(z.string()),
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
  proposition: z.string(),
  proArguments: z.array(z.object({
    argument: z.string(),
    evidence: z.array(z.string()),
    strength: z.number().min(0).max(1),
  })),
  conArguments: z.array(z.object({
    argument: z.string(),
    evidence: z.array(z.string()),
    strength: z.number().min(0).max(1),
  })),
  keyDisputes: z.array(z.string()),
  recommendation: z.object({
    decision: z.enum(['support', 'oppose', 'modify']),
    reasoning: z.string(),
    conditions: z.array(z.string()).optional(),
  }),
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
    questionValidity: z.array(z.string()),
    logicalGaps: z.array(z.string()),
    assumptionChallenges: z.array(z.string()),
    biases: z.array(z.string()),
  }),
  strengthsWeaknesses: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    missingEvidence: z.array(z.string()),
  }),
  recommendations: z.array(z.string()),
});

export type CriticalOutput = z.infer<typeof CriticalOutput>;

/**
 * 思考プロセス全体の統合結果
 */
export const IntegratedThinkingResult = z.object({
  phase: DevelopmentPhase,
  primaryMethod: ThinkingMethodType,
  secondaryMethods: z.array(ThinkingMethodType),
  results: z.array(ThinkingResult),
  synthesis: z.string(),
  actionItems: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  nextSteps: z.array(z.string()),
});

export type IntegratedThinkingResult = z.infer<typeof IntegratedThinkingResult>;
