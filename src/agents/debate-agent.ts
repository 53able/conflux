import { 
  type AgentCapability,
  type FunctionalAgent,
  type AgentConfig,
  type PromptGenerator,
  type ConfidenceCalculator,
  type ReasoningGenerator,
  type NextStepRecommender
} from '../core/agent-base.js';
import { 
  ThinkingMethodType, 
  DevelopmentPhase
} from '../schemas/index.js';
import * as E from 'fp-ts/lib/Either.js';
import { extractSchemaRequirements } from '../core/schema-utils.js';
import { type DebateInput, type DebateOutput, DebateInputSchema, DebateOutputSchema } from '../schemas/index.js';

/**
 * ディベート思考エージェント（関数型スタイル）
 * 
 * 機能:
 * 1. 複数の視点から論点を検討する
 * 2. 対立する意見を整理する
 * 3. バランスの取れた結論を導く
 * 
 * 適用場面:
 * - 意思決定
 * - 設計判断
 * - 問題解決
 */

// ============================================================================
// 関数型スタイルのディベート思考エージェント
// ============================================================================


// エージェント能力定義
const debateCapability: AgentCapability = {
  methodType: 'debate' as ThinkingMethodType,
  description: '複数の視点から論点を検討しバランスの取れた結論を導く',
  applicablePhases: [
    'decision_making',
    'architecture_design',
    'problem_solving'
  ] as DevelopmentPhase[],
  requiredInputSchema: DebateInputSchema,
  outputSchema: DebateOutputSchema,
  combinationSynergies: ['critical', 'meta', 'logical'] as ThinkingMethodType[],
};

// エージェント設定
const debateConfig: AgentConfig = {
  temperature: 0.6,
  maxRetries: 3,
  enableAutoRecovery: true,
  schemaName: 'DebateOutput',
  schemaDescription: 'ディベート思考の分析結果を表す構造化データ',
  mode: 'json'
};

// プロンプト生成関数
const generateDebatePrompts: PromptGenerator<DebateInput> = (input, capability) => {
  // スキーマから統合された要件を生成
  const schemaRequirements = extractSchemaRequirements(capability.outputSchema);

  const systemPrompt = `あなたはディベート思考の専門家です。複数の視点から論点を検討し、バランスの取れた結論を導いてください。

ディベート思考の手順:
1. 論点を明確にする
2. 複数の立場を特定する
3. 各立場の論拠を整理する
4. 各立場の強みと弱みを分析する
5. 統合的な結論を導く

重要: 以下のJSON形式で厳密に出力してください。他のテキストは含めず、JSONのみを出力してください。

${schemaRequirements}

ディベート思考の本質である「多角的視点」を重視し、公平で建設的な分析を行ってください。`;

  const userPrompt = `以下のトピックについて、ディベート思考により多角的に検討してください。

トピック:
${input.topic}

${(input.positions && input.positions.length > 0) ? `既存の立場:\n${input.positions.map((p, i) => `${i + 1}. ${p}`).join('\n')}` : ''}

${input.context ? `コンテキスト: ${input.context}` : ''}
${input.domain ? `ドメイン: ${input.domain}` : ''}

上記のトピックについて複数の立場を検討し、各立場の論拠・強み・弱みを分析して、統合的な結論を導いてください。`;

  return E.right({ system: systemPrompt, user: userPrompt });
};

// 信頼度計算関数
const calculateDebateConfidence: ConfidenceCalculator<DebateOutput> = (output, _context) => {
  // ディベート思考の信頼度は立場の多様性と分析の深さに基づく
  const proArgumentsCount = output.proArguments.length;
  const conArgumentsCount = output.conArguments.length;
  const positionDiversity = proArgumentsCount + conArgumentsCount;
  
  const analysisDepth = (
    output.proArguments.reduce((sum, arg) => sum + arg.evidence.length, 0) +
    output.conArguments.reduce((sum, arg) => sum + arg.evidence.length, 0)
  ) / Math.max(positionDiversity, 1);
  
  const baseConfidence = output.confidence;
  const diversityBonus = Math.min(positionDiversity * 0.1, 0.3);
  const depthBonus = Math.min(analysisDepth * 0.05, 0.2);
  
  // 主要な争点の明確さによるボーナス
  const disputesBonus = Math.min(output.keyDisputes.length * 0.05, 0.1);
  
  return Math.min(baseConfidence + diversityBonus + depthBonus + disputesBonus, 1.0);
};

// 推論説明生成関数
const generateDebateReasoning: ReasoningGenerator<DebateInput, DebateOutput> = (input, output, _context) => {
  return `「${input.topic}」について、${output.proArguments.length}個の賛成論点と${output.conArguments.length}個の反対論点を検討し、${output.keyDisputes.length}個の主要な争点を特定しました。最終判断: ${output.recommendation.decision}（理由: ${output.recommendation.reasoning}）。多角的視点によるバランスの取れた結論を導出しました（信頼度: ${(output.confidence * 100).toFixed(1)}%）`;
};

// 次ステップ推奨関数
const recommendDebateNextSteps: NextStepRecommender = (_result, phase) => {
  const baseRecommendations: ThinkingMethodType[] = ['critical', 'meta'];
  
  // 意思決定では批判的思考も有効
  if (phase === 'decision_making') {
    baseRecommendations.push('critical');
  }
  
  // 設計判断では論理的思考も重要
  if (phase === 'architecture_design') {
    baseRecommendations.push('logical');
  }

  return baseRecommendations;
};

// 関数型エージェントの定義
export const debateAgent: FunctionalAgent<DebateInput, DebateOutput> = {
  capability: debateCapability,
  config: debateConfig,
  generatePrompts: generateDebatePrompts,
  calculateConfidence: calculateDebateConfidence,
  generateReasoning: generateDebateReasoning,
  recommendNextSteps: recommendDebateNextSteps,
};
