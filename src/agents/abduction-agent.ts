import { 
  type AgentCapability,
  type FunctionalAgent,
  type AgentConfig,
  type PromptGenerator,
  type ConfidenceCalculator,
  type ReasoningGenerator,
  type NextStepRecommender,
} from '../core/agent-base.js';
import { 
  ThinkingMethodType, 
  DevelopmentPhase, 
} from '../schemas/index.js';
import * as E from 'fp-ts/lib/Either.js';
import { extractSchemaRequirements } from '../core/schema-utils.js';
import { type AbductionInput, type AbductionOutput, AbductionInputSchema, AbductionOutputSchema } from '../schemas/index.js';

/**
 * アブダクション思考エージェント（関数型スタイル）
 * 
 * 機能:
 * 1. 驚きの事実を特定する
 * 2. 説明仮説を生成する
 * 3. 仮説の妥当性を評価する
 * 
 * 適用場面:
 * - 事業探索
 * - デバッグ・障害分析
 * - 問題解決
 */

// ============================================================================
// 関数型スタイルのアブダクション思考エージェント
// ============================================================================


// エージェント能力定義
const abductionCapability: AgentCapability = {
  methodType: 'abduction' as ThinkingMethodType,
  description: '驚きの事実から説明仮説を形成する',
  applicablePhases: [
    'business_exploration',
    'debugging'
  ] as DevelopmentPhase[],
  requiredInputSchema: AbductionInputSchema,
  outputSchema: AbductionOutputSchema,
  combinationSynergies: ['critical', 'deductive', 'inductive', 'meta'],
};

// エージェント設定
const abductionConfig: AgentConfig = {
  temperature: 0.4,
  maxRetries: 3,
  enableAutoRecovery: true,
  schemaName: 'AbductionOutput',
  schemaDescription: 'アブダクション思考の分析結果を表す構造化データ',
  mode: 'json'
};

// プロンプト生成関数
const generateAbductionPrompts: PromptGenerator<AbductionInput> = (input, capability) => {
  // スキーマから統合された要件を生成
  const schemaRequirements = extractSchemaRequirements(capability.outputSchema);

  const systemPrompt = `あなたはアブダクション思考の専門家です。驚きの事実から最も可能性の高い説明仮説を生成してください。

アブダクション思考の手順:
1. 驚きの事実を正確に理解する
2. 可能な説明仮説を複数生成する
3. 各仮説の妥当性を評価する
4. 最も可能性の高い仮説を選択する

重要: 以下のJSON形式で厳密に出力してください。他のテキストは含めず、JSONのみを出力してください。

${schemaRequirements}

アブダクション思考の本質である「最良の説明」を重視し、創造的かつ論理的な仮説生成を行ってください。`;

  const userPrompt = `以下の驚きの事実について、最も可能性の高い説明仮説を生成してください。

驚きの事実:
${input.surprisingFact}

${input.context ? `コンテキスト: ${input.context}` : ''}
${input.domain ? `ドメイン: ${input.domain}` : ''}

上記の事実を説明する最も可能性の高い仮説を生成し、その理由を説明してください。`;

  return E.right({ system: systemPrompt, user: userPrompt });
};

// 信頼度計算関数
const calculateAbductionConfidence: ConfidenceCalculator<AbductionOutput> = (output, _context) => {
  // アブダクションの信頼度は仮説の論理的整合性と証拠の強さに基づく
  const baseConfidence = output.confidence;
  
  // 仮説の説明の詳細さによるボーナス
  const explanationBonus = output.hypotheses.length > 0 
    ? Math.min(output.hypotheses[0].explanation.length / 200, 0.2)
    : 0;
  
  // 推論の論理性によるボーナス
  const reasoningBonus = output.reasoning.includes('論理的') || output.reasoning.includes('証拠') ? 0.1 : 0;
  
  // 仮説の妥当性によるボーナス
  const plausibilityBonus = output.hypotheses.length > 0 
    ? output.hypotheses[0].plausibility * 0.1
    : 0;
  
  return Math.min(baseConfidence + explanationBonus + reasoningBonus + plausibilityBonus, 1.0);
};

// 推論説明生成関数
const generateAbductionReasoning: ReasoningGenerator<AbductionInput, AbductionOutput> = (input, output, _context) => {
  const topHypothesis = output.hypotheses.length > 0 ? output.hypotheses[0] : null;
  const hypothesisText = topHypothesis ? topHypothesis.explanation : '仮説なし';
  return `「${input.surprisingFact}」という驚きの事実から、アブダクション思考により${output.hypotheses.length}個の仮説を生成しました。最も可能性の高い仮説: ${hypothesisText}（信頼度: ${(output.confidence * 100).toFixed(1)}%）`;
};

// 次ステップ推奨関数
const recommendAbductionNextSteps: NextStepRecommender = (result, phase) => {
  const baseRecommendations: ThinkingMethodType[] = ['critical', 'deductive'];
  
  // 事業探索では帰納的思考とメタ思考も有効
  if (phase === 'business_exploration') {
    baseRecommendations.push('inductive', 'meta');
  }
  
  // デバッグでは論理的思考も重要
  if (phase === 'debugging') {
    baseRecommendations.push('logical');
  }

  return baseRecommendations;
};

// 関数型エージェントの定義
export const abductionAgent: FunctionalAgent<AbductionInput, AbductionOutput> = {
  capability: abductionCapability,
  config: abductionConfig,
  generatePrompts: generateAbductionPrompts,
  calculateConfidence: calculateAbductionConfidence,
  generateReasoning: generateAbductionReasoning,
  recommendNextSteps: recommendAbductionNextSteps,
};
