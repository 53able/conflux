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
import { extractSchemaRequirements } from '../core/schema-utils.js';
import { type PACInput, type PACOutput, PACInputSchema, PACOutputSchema } from '../schemas/index.js';

/**
 * PAC思考エージェント（関数型スタイル）
 * 
 * 機能:
 * 1. 仮説を前提・仮定・結論に分解する
 * 2. 仮定と前提の妥当性を検証する
 * 3. 検証可能な方法を提示する
 * 
 * 適用場面:
 * - 仮説分解
 * - ふりかえり
 */

// ============================================================================
// 関数型スタイルのPAC思考エージェント
// ============================================================================


// エージェント能力定義
const pacCapability: AgentCapability = {
  methodType: 'pac' as ThinkingMethodType,
  description: '仮説を前提・仮定・結論に分解し検証する',
  applicablePhases: [ 
    'hypothesis_breakdown',
    'retrospective'
  ] as DevelopmentPhase[],
  requiredInputSchema: PACInputSchema,
  outputSchema: PACOutputSchema,
  combinationSynergies: ['critical', 'deductive', 'meta', 'logical'],
};

// エージェント設定
const pacConfig: AgentConfig = {
  temperature: 0.2,
  maxRetries: 3,
  enableAutoRecovery: true,
  schemaName: 'PACOutput',
  schemaDescription: 'PAC思考の分析結果を表す構造化データ',
  mode: 'json'
};

// プロンプト生成関数
const generatePACPrompts: PromptGenerator<PACInput> = (input, capability) => {
  // スキーマから統合された要件を生成
  const schemaRequirements = extractSchemaRequirements(capability.outputSchema);

  const systemPrompt = `あなたはPAC思考の専門家です。仮説を前提・仮定・結論に分解し、検証可能な方法を提示してください。

PAC思考の手順:
1. 主張を前提・仮定・結論に分解する
2. 前提の妥当性を検証する
3. 仮定の妥当性を検証する
4. 論理の妥当性を検証する
5. 検証可能な方法を提示する

重要: 以下のJSON形式で厳密に出力してください。他のテキストは含めず、JSONのみを出力してください。

${schemaRequirements}

PAC思考の本質である「前提・仮定・結論」の明確な分離と検証可能性を重視してください。`;

  const userPrompt = `以下の主張をPAC思考により分解・検証してください。

主張:
${input.claim}

${input.context ? `コンテキスト: ${input.context}` : ''}
${input.domain ? `ドメイン: ${input.domain}` : ''}

上記の主張を前提・仮定・結論に分解し、各要素の妥当性を検証し、検証可能な方法を提示してください。`;

  return E.right({ system: systemPrompt, user: userPrompt });
};

// 信頼度計算関数
const calculatePACConfidence: ConfidenceCalculator<PACOutput> = (output, _context) => {
  // PAC思考の信頼度は分解の明確さと検証可能性に基づく
  const assumptionValidity = output.assumptions_validity.isValid ? 1 : 0;
  const premiseReliability = output.premise_validity.isReliable ? 1 : 0;
  const validationScore = (assumptionValidity + premiseReliability) / 2;
  
  const testMethodsBonus = Math.min(output.assumptions_validity.testMethods.length * 0.1, 0.2);
  const concernsBonus = Math.min(output.assumptions_validity.concerns.length * 0.05, 0.1);
  const baseConfidence = output.confidence;
  
  return Math.min(baseConfidence * validationScore + testMethodsBonus + concernsBonus, 1.0);
};

// 推論説明生成関数
const generatePACReasoning: ReasoningGenerator<PACInput, PACOutput> = (input, output, _context) => {
  return `「${input.claim}」をPAC思考により分解し、前提: ${output.premise}、仮定: ${output.assumption}、結論: ${output.conclusion}に分離しました。仮定の妥当性: ${output.assumptions_validity.isValid ? '妥当' : '不適切'}、前提の信頼性: ${output.premise_validity.isReliable ? '信頼できる' : '信頼できない'}。${output.assumptions_validity.testMethods.length}個の検証方法を提示し、仮説の検証可能性を確保しました（信頼度: ${(output.confidence * 100).toFixed(1)}%）`;
};

// 次ステップ推奨関数
const recommendPACNextSteps: NextStepRecommender = (_result, phase) => {
  const baseRecommendations: ThinkingMethodType[] = ['critical', 'deductive'];
  
  // 仮説分解では批判的思考も有効
  if (phase === 'hypothesis_breakdown') {
    baseRecommendations.push('critical');
  }
  
  // ふりかえりではメタ思考とロジカル思考も重要
  if (phase === 'retrospective') {
    baseRecommendations.push('meta', 'logical');
  }
  
  // 価値仮説では帰納的思考も有効
  if (phase === 'value_hypothesis') {
    baseRecommendations.push('inductive');
  }

  return baseRecommendations;
};

// 関数型エージェントの定義
export const pacAgent: FunctionalAgent<PACInput, PACOutput> = {
  capability: pacCapability,
  config: pacConfig,
  generatePrompts: generatePACPrompts,
  calculateConfidence: calculatePACConfidence,
  generateReasoning: generatePACReasoning,
  recommendNextSteps: recommendPACNextSteps,
};
