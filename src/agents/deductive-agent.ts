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
import { type DeductiveInput, type DeductiveOutput, DeductiveInputSchema, DeductiveOutputSchema } from '../schemas/index.js';

/**
 * 演繹的思考エージェント（関数型スタイル）
 * 
 * 機能:
 * 1. 大前提を把握する
 * 2. 小前提を把握する  
 * 3. 結論を導く
 * 
 * 適用場面:
 * - アーキ設計（原則/制約→設計結論）
 * - 実装（新機能）（原則/規約→具体コード）
 * - デバッグ/障害対応（再現条件想定）
 * - テスト設計（仕様原則→テスト条件導出）
 */

// ============================================================================
// 関数型スタイルの演繹的思考エージェント
// ============================================================================


// エージェント能力定義
const deductiveCapability: AgentCapability = {
  methodType: 'deductive' as ThinkingMethodType,
  description: '一般原則から具体的結論を導出する',
  applicablePhases: [
    'architecture_design',
    'implementation',
    'debugging',
    'test_design'
  ] as DevelopmentPhase[],
  requiredInputSchema: DeductiveInputSchema,
  outputSchema: DeductiveOutputSchema,
  combinationSynergies: ['logical', 'critical', 'abduction'] as ThinkingMethodType[],
};

// エージェント設定
const deductiveConfig: AgentConfig = {
  temperature: 0.1,
  maxRetries: 3,
  enableAutoRecovery: true,
  schemaName: 'DeductiveOutput',
  schemaDescription: '演繹的思考の分析結果を表す構造化データ',
  mode: 'json'
};

// プロンプト生成関数
const generateDeductivePrompts: PromptGenerator<DeductiveInput> = (input, capability) => {
  // スキーマから統合された要件を生成
  const schemaRequirements = extractSchemaRequirements(capability.outputSchema);

  const systemPrompt = `あなたは演繹的思考の専門家です。大前提と小前提から論理的に結論を導いてください。

演繹的思考の手順:
1. 大前提を正確に理解する
2. 小前提を正確に理解する
3. 論理的な推論ステップを構築する
4. 結論を導出する
5. 論理の妥当性を検証する

重要: 以下のJSON形式で厳密に出力してください。他のテキストは含めず、JSONのみを出力してください。

${schemaRequirements}

演繹的思考の本質である「一般から特殊へ」の論理的推論を重視し、厳密で正確な結論導出を行ってください。`;

  const userPrompt = `以下の大前提と小前提から、演繹的に結論を導いてください。

大前提:
${input.majorPremise}

小前提:
${input.minorPremise}

${input.context ? `コンテキスト: ${input.context}` : ''}
${input.domain ? `ドメイン: ${input.domain}` : ''}

上記の前提から論理的に結論を導出し、推論プロセスを詳細に説明してください。`;

  return E.right({ system: systemPrompt, user: userPrompt });
};

// 信頼度計算関数
const calculateDeductiveConfidence: ConfidenceCalculator<DeductiveOutput> = (output, _context) => {
  // 演繹的思考の信頼度は論理の妥当性と推論ステップの明確さに基づく
  const validityBonus = output.validityCheck.isValid ? 0.2 : 0;
  const premiseReliabilityBonus = output.validityCheck.premiseReliability * 0.1;
  const implicationsBonus = Math.min(output.implications.length * 0.05, 0.2);
  const baseConfidence = output.confidence;
  
  return Math.min(baseConfidence + validityBonus + premiseReliabilityBonus + implicationsBonus, 1.0);
};

// 推論説明生成関数
const generateDeductiveReasoning: ReasoningGenerator<DeductiveInput, DeductiveOutput> = (input, output, _context) => {
  return `「${input.majorPremise}」という大前提と「${input.minorPremise}」という小前提から、演繹的に「${output.conclusion}」という結論を導出しました。論理の妥当性: ${output.validityCheck.isValid ? '妥当' : '不適切'}、前提の信頼性: ${(output.validityCheck.premiseReliability * 100).toFixed(1)}%、含意数: ${output.implications.length}個、信頼度: ${(output.confidence * 100).toFixed(1)}%`;
};

// 次ステップ推奨関数
const recommendDeductiveNextSteps: NextStepRecommender = (_result, phase) => {
  const baseRecommendations: ThinkingMethodType[] = ['logical', 'critical'];
  
  // アーキ設計ではMECE思考も有効
  if (phase === 'architecture_design') {
    baseRecommendations.push('mece');
  }
  
  // 実装では帰納的思考も重要
  if (phase === 'implementation') {
    baseRecommendations.push('inductive');
  }

  return baseRecommendations;
};

// 関数型エージェントの定義
export const deductiveAgent: FunctionalAgent<DeductiveInput, DeductiveOutput> = {
  capability: deductiveCapability,
  config: deductiveConfig,
  generatePrompts: generateDeductivePrompts,
  calculateConfidence: calculateDeductiveConfidence,
  generateReasoning: generateDeductiveReasoning,
  recommendNextSteps: recommendDeductiveNextSteps,
};
