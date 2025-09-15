import { 
  type AgentCapability,
  type FunctionalAgent,
  type AgentConfig,
  type PromptGenerator,
  type ConfidenceCalculator,
  type ReasoningGenerator,
  type NextStepRecommender,
} from '../core/index.js';
import { 
  ThinkingMethodType, 
  DevelopmentPhase, 
} from '../schemas/index.js';
import * as E from 'fp-ts/lib/Either.js';
import { generateSchemaExample, generateSchemaInstructions } from '../core/llm-integration.js';
import { type MetaInput, type MetaOutput, MetaInputSchema, MetaOutputSchema } from '../schemas/index.js';

/**
 * メタ思考エージェント（関数型スタイル）
 * 
 * 機能:
 * 1. 思考プロセス自体を対象化する
 * 2. より高次の視点から評価・改善する
 * 3. 思考の思考による質的向上
 * 
 * 適用場面:
 * - ふりかえり/改善
 * - 見積もり/計画
 * - 意思決定
 */

// ============================================================================
// 関数型スタイルのメタ思考エージェント
// ============================================================================


// エージェント能力定義
const metaCapability: AgentCapability = {
  methodType: 'meta' as ThinkingMethodType,
  description: '思考プロセス自体を対象化し高次の視点から評価・改善する',
  applicablePhases: [
    'retrospective',
    'estimation_planning',
    'decision_making'
  ] as DevelopmentPhase[],
  requiredInputSchema: MetaInputSchema,
  outputSchema: MetaOutputSchema,
  combinationSynergies: ['critical', 'logical', 'debate'] as ThinkingMethodType[],
};

// エージェント設定
const metaConfig: AgentConfig = {
  temperature: 0.5,
  maxRetries: 3,
  enableAutoRecovery: true,
  schemaName: 'MetaOutput',
  schemaDescription: 'メタ思考の分析結果を表す構造化データ',
  mode: 'json'
};

// プロンプト生成関数
const generateMetaPrompts: PromptGenerator<MetaInput> = (input, capability) => {
  // スキーマから動的にJSON例と注意事項を生成
  const schemaExample = generateSchemaExample(capability.outputSchema);
  const schemaInstructions = generateSchemaInstructions(capability.outputSchema);

  const systemPrompt = `あなたはメタ思考の専門家です。思考プロセス自体を対象化し、より高次の視点から評価・改善してください。

メタ思考の手順:
1. 現在の思考プロセスを客観視する
2. 思考の強みと弱みを分析する
3. 改善点を特定する
4. 高次の洞察を得る
5. 具体的な推奨事項を提示する

重要: 以下のJSON形式で厳密に出力してください。他のテキストは含めず、JSONのみを出力してください。

${schemaExample}

注意事項:
${schemaInstructions}

メタ思考の本質である「思考の思考」を重視し、客観的で建設的な改善提案を行ってください。`;

  const userPrompt = `以下の思考プロセスをメタ思考により評価・改善してください。

現在の思考内容:
${input.currentThinking}

目標:
${input.objective}

${input.context ? `コンテキスト: ${input.context}` : ''}

上記の思考プロセスを客観的に評価し、改善点と高次の洞察を提示してください。`;

  return E.right({ system: systemPrompt, user: userPrompt });
};

// 信頼度計算関数
const calculateMetaConfidence: ConfidenceCalculator<MetaOutput> = (output, _context) => {
  // メタ思考の信頼度は分析の深さと洞察の質に基づく
  const processEvaluationQuality = (
    output.processEvaluation.currentProcess.length +
    output.processEvaluation.gaps.length
  ) / 2;
  
  const recommendationsQuality = output.recommendations.length;
  const alternativeApproachesQuality = output.alternativeApproaches.length;
  
  const baseConfidence = output.confidence;
  const evaluationBonus = Math.min(processEvaluationQuality * 0.1, 0.2);
  const recommendationsBonus = Math.min(recommendationsQuality * 0.05, 0.1);
  const alternativesBonus = Math.min(alternativeApproachesQuality * 0.05, 0.1);
  
  return Math.min(baseConfidence + evaluationBonus + recommendationsBonus + alternativesBonus, 1.0);
};

// 推論説明生成関数
const generateMetaReasoning: ReasoningGenerator<MetaInput, MetaOutput> = (input, output, _context) => {
  return `「${input.currentThinking}」という思考プロセスをメタ思考により評価し、プロセスの有効性: ${(output.processEvaluation.effectiveness * 100).toFixed(1)}%、${output.processEvaluation.gaps.length}個のギャップを特定しました。${output.recommendations.length}個の改善推奨事項と${output.alternativeApproaches.length}個の代替アプローチを提示し、思考の質的向上を支援します（信頼度: ${(output.confidence * 100).toFixed(1)}%）`;
};

// 次ステップ推奨関数
const recommendMetaNextSteps: NextStepRecommender = (_result, phase) => {
  const baseRecommendations: ThinkingMethodType[] = ['critical', 'logical'];
  
  // ふりかえりでは批判的思考も有効
  if (phase === 'retrospective') {
    baseRecommendations.push('critical');
  }
  
  // 意思決定ではディベート思考も重要
  if (phase === 'decision_making') {
    baseRecommendations.push('debate');
  }

  return baseRecommendations;
};

// 関数型エージェントの定義
export const metaAgent: FunctionalAgent<MetaInput, MetaOutput> = {
  capability: metaCapability,
  config: metaConfig,
  generatePrompts: generateMetaPrompts,
  calculateConfidence: calculateMetaConfidence,
  generateReasoning: generateMetaReasoning,
  recommendNextSteps: recommendMetaNextSteps,
};
