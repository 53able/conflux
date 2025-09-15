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
import { generateSchemaExample, generateSchemaInstructions } from '../core/llm-integration.js';
import { type CriticalInput, type CriticalOutput, CriticalInputSchema, CriticalOutputSchema } from '../schemas/index.js';

/**
 * 批判的思考エージェント（関数型スタイル）
 * 
 * 機能:
 * 1. 主張を多角的に検証する
 * 2. 前提・論点・根拠を体系的に疑う
 * 3. 論理的な評価を行う
 * 
 * 適用場面:
 * - リファクタリング
 * - コードレビュー
 * - 意思決定
 */

// ============================================================================
// 関数型スタイルの批判的思考エージェント
// ============================================================================


// エージェント能力定義
const criticalCapability: AgentCapability = {
  methodType: 'critical' as ThinkingMethodType,
  description: '前提・論点・根拠を体系的に疑い論理的に評価する',
  applicablePhases: [
    'refactoring',
    'code_review',
    'decision_making'
  ] as DevelopmentPhase[],
  requiredInputSchema: CriticalInputSchema,
  outputSchema: CriticalOutputSchema,
  combinationSynergies: ['logical', 'mece', 'deductive', 'meta'] ,
};

// エージェント設定
const criticalConfig: AgentConfig = {
  temperature: 0.4,
  maxRetries: 3,
  enableAutoRecovery: true,
  schemaName: 'CriticalOutput',
  schemaDescription: '批判的思考の分析結果を表す構造化データ',
  mode: 'json'
};

// プロンプト生成関数
const generateCriticalPrompts: PromptGenerator<CriticalInput> = (input, capability) => {
  // スキーマから動的にJSON例と注意事項を生成
  const schemaExample = generateSchemaExample(capability.outputSchema);
  const schemaInstructions = generateSchemaInstructions(capability.outputSchema);

  const systemPrompt = `あなたは批判的思考の専門家です。主張を多角的に検証し、論理的な評価を行ってください。

批判的思考の手順:
1. 主張の前提を特定する
2. 根拠の妥当性を検証する
3. 反対意見を考慮する
4. 論理的な結論を導く

重要: 以下のJSON形式で厳密に出力してください。他のテキストは含めず、JSONのみを出力してください。

${schemaExample}

注意事項:
${schemaInstructions}

批判的思考の本質である「疑う力」を重視し、客観的かつ建設的な分析を行ってください。`;

  const userPrompt = `以下の主張について、批判的思考により多角的に検証してください。

主張:
${input.claim}

${(input.evidence && input.evidence.length > 0) ? `根拠:\n${input.evidence.map((e, i) => `${i + 1}. ${e}`).join('\n')}` : ''}

${input.context ? `コンテキスト: ${input.context}` : ''}
${input.domain ? `ドメイン: ${input.domain}` : ''}

上記の主張を多角的に検証し、論理的な評価を行ってください。`;

  return E.right({ system: systemPrompt, user: userPrompt });
};

// 信頼度計算関数
const calculateCriticalConfidence: ConfidenceCalculator<CriticalOutput> = (output, _context) => {
  // 批判的思考の信頼度は分析の網羅性と論理性に基づく
  const analysisCompleteness = (
    output.strengthsWeaknesses.strengths.length +
    output.strengthsWeaknesses.weaknesses.length +
    output.questioningResults.assumptionChallenges.length +
    output.questioningResults.logicalGaps.length
  ) / 4;
  
  const baseConfidence = output.confidence;
  const completenessBonus = Math.min(analysisCompleteness * 0.1, 0.2);
  
  // 推奨事項の質によるボーナス
  const recommendationsBonus = Math.min(output.recommendations.length * 0.05, 0.1);
  
  return Math.min(baseConfidence + completenessBonus + recommendationsBonus, 1.0);
};

// 推論説明生成関数
const generateCriticalReasoning: ReasoningGenerator<CriticalInput, CriticalOutput> = (input, output, _context) => {
  return `「${input.claim}」という主張を批判的に分析し、${output.strengthsWeaknesses.strengths.length}個の強み、${output.strengthsWeaknesses.weaknesses.length}個の弱み、${output.questioningResults.assumptionChallenges.length}個の仮定への挑戦、${output.questioningResults.logicalGaps.length}個の論理的ギャップを特定しました。${output.recommendations.length}個の改善推奨事項を提示しました（信頼度: ${(output.confidence * 100).toFixed(1)}%）`;
};

// 次ステップ推奨関数
const recommendCriticalNextSteps: NextStepRecommender = (result, phase) => {
  const baseRecommendations: ThinkingMethodType[] = ['logical', 'mece'];
  
  // リファクタリングでは演繹的思考も有効
  if (phase === 'refactoring') {
    baseRecommendations.push('deductive');
  }
  
  // コードレビューでは演繹的思考も重要
  if (phase === 'code_review') {
    baseRecommendations.push('deductive');
  }
  
  // 意思決定ではメタ思考も重要
  if (phase === 'decision_making') {
    baseRecommendations.push('meta');
  }

  return baseRecommendations;
};

// 関数型エージェントの定義
export const criticalAgent: FunctionalAgent<CriticalInput, CriticalOutput> = {
  capability: criticalCapability,
  config: criticalConfig,
  generatePrompts: generateCriticalPrompts,
  calculateConfidence: calculateCriticalConfidence,
  generateReasoning: generateCriticalReasoning,
  recommendNextSteps: recommendCriticalNextSteps,
};
