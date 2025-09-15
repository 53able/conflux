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
import { type LogicalInput, type LogicalOutput, LogicalInputSchema, LogicalOutputSchema } from '../schemas/index.js';

/**
 * ロジカルシンキング思考エージェント（関数型スタイル）
 * 
 * 機能:
 * 1. 論点を決める
 * 2. 情報を集める
 * 3. 何がいえるかを考える
 * 4. 論理を構造化する
 * 
 * 適用場面:
 * - 要件定義
 * - 見積もり/計画
 * - 優先順位付け
 * - ふりかえり/改善
 */

// ============================================================================
// 関数型スタイルのロジカルシンキングエージェント
// ============================================================================


// エージェント能力定義
const logicalCapability: AgentCapability = {
  methodType: 'logical' as ThinkingMethodType,
  description: '論点から結論への論理的道筋を構築する',
  applicablePhases: [
    'requirement_definition',
    'estimation_planning',
    'prioritization',
    'retrospective'
  ] as DevelopmentPhase[],
  requiredInputSchema: LogicalInputSchema,
  outputSchema: LogicalOutputSchema,
  combinationSynergies: ['critical', 'mece', 'deductive', 'meta']
};

// エージェント設定
const logicalConfig: AgentConfig = {
  temperature: 0.3,
  maxRetries: 3,
  enableAutoRecovery: true,
  schemaName: 'LogicalOutput',
  schemaDescription: 'ロジカルシンキングの分析結果を表す構造化データ',
  mode: 'json'
};

// プロンプト生成関数
const generateLogicalPrompts: PromptGenerator<LogicalInput> = (input, capability) => {
  // スキーマから統合された要件を生成
  const schemaRequirements = extractSchemaRequirements(capability.outputSchema);

  const systemPrompt = `あなたはロジカルシンキングの専門家です。論点から結論への論理的道筋を構築してください。

ロジカルシンキングの手順:
1. 論点を明確にする
2. 関連する事実を整理する
3. 論理的な分析を行う
4. 含意を導出する
5. 結論を構築する

重要: 以下のJSON形式で厳密に出力してください。他のテキストは含めず、JSONのみを出力してください。

${schemaRequirements}

ロジカルシンキングの本質である「論理的思考」を重視し、明確で一貫した結論構築を行ってください。`;

  const userPrompt = `以下の質問について、ロジカルシンキングにより論理的な結論を構築してください。

質問:
${input.question}

${input.context ? `コンテキスト: ${input.context}` : ''}
${(input.constraints && input.constraints.length > 0) ? `制約:\n${input.constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')}` : ''}
${input.domain ? `ドメイン: ${input.domain}` : ''}

上記の質問について論点を明確にし、事実を整理し、論理的な分析を行って結論を構築してください。`;

  return E.right({ system: systemPrompt, user: userPrompt });
};

// 信頼度計算関数
const calculateLogicalConfidence: ConfidenceCalculator<LogicalOutput> = (output, _context) => {
  // ロジカルシンキングの信頼度は論理構造の完全性と一貫性に基づく
  const reasoningSteps = output.reasoning.length;
  const evidenceCount = output.reasoning.reduce((sum, step) => sum + step.evidence.length, 0);
  const pyramidSupports = output.pyramid.supports.length;
  
  const baseConfidence = output.confidence;
  const stepsBonus = Math.min(reasoningSteps * 0.05, 0.2);
  const evidenceBonus = Math.min(evidenceCount * 0.02, 0.2);
  const pyramidBonus = Math.min(pyramidSupports * 0.05, 0.1);
  
  return Math.min(baseConfidence + stepsBonus + evidenceBonus + pyramidBonus, 1.0);
};

// 推論説明生成関数
const generateLogicalReasoning: ReasoningGenerator<LogicalInput, LogicalOutput> = (input, output, _context) => {
  const evidenceCount = output.reasoning.reduce((sum, step) => sum + step.evidence.length, 0);
  return `「${input.question}」という質問について、${output.reasoning.length}個の推論ステップを経て「${output.conclusion}」という結論を構築しました。ピラミッド構造では${output.pyramid.supports.length}個の支持主張を整理し、合計${evidenceCount}個の根拠を収集しました（信頼度: ${(output.confidence * 100).toFixed(1)}%）`;
};

// 次ステップ推奨関数
const recommendLogicalNextSteps: NextStepRecommender = (_result, phase) => {
  const baseRecommendations: ThinkingMethodType[] = ['critical', 'mece'];
  
  // 要件定義ではPAC思考も有効
  if (phase === 'requirement_definition') {
    baseRecommendations.push('pac');
  }
  
  // 見積もりでは演繹的思考とメタ思考も重要
  if (phase === 'estimation_planning') {
    baseRecommendations.push('deductive', 'meta');
  }
  
  // ふりかえりではPAC思考も重要
  if (phase === 'retrospective') {
    baseRecommendations.push('pac');
  }

  return baseRecommendations;
};

// 関数型エージェントの定義
export const logicalAgent: FunctionalAgent<LogicalInput, LogicalOutput> = {
  capability: logicalCapability,
  config: logicalConfig,
  generatePrompts: generateLogicalPrompts,
  calculateConfidence: calculateLogicalConfidence,
  generateReasoning: generateLogicalReasoning,
  recommendNextSteps: recommendLogicalNextSteps,
};
