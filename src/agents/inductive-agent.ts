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
import { pipe } from 'fp-ts/lib/function.js';
import { generateSchemaExample, generateSchemaInstructions } from '../core/llm-integration.js';
import { type InductiveInput, type InductiveOutput, InductiveInputSchema, InductiveOutputSchema } from '../schemas/index.js';

/**
 * 帰納的思考エージェント（関数型スタイル）
 * 
 * 機能:
 * 1. 個別事例を収集・分析する
 * 2. 共通パターンを発見する
 * 3. 一般論・仮説を構築する
 * 
 * 適用場面:
 * - 価値仮説の検証
 * - 実験・テスト結果の分析
 * - デバッグ・障害分析
 */

// ============================================================================
// 関数型スタイルの帰納的思考エージェント
// ============================================================================


// エージェント能力定義
const inductiveCapability: AgentCapability = {
  methodType: 'inductive' as ThinkingMethodType,
  description: '個別事例から共通パターンを発見し一般論を構築する',
  applicablePhases: [
    'value_hypothesis',
    'experimentation',
    'debugging'
  ] as DevelopmentPhase[],
  requiredInputSchema: InductiveInputSchema,
  outputSchema: InductiveOutputSchema,
  combinationSynergies: ['critical', 'deductive', 'abduction', 'meta'],
};

// エージェント設定
const inductiveConfig: AgentConfig = {
  temperature: 0.3,
  maxRetries: 3,
  enableAutoRecovery: true,
  schemaName: 'InductiveOutput',
  schemaDescription: '帰納的思考の分析結果を表す構造化データ',
  mode: 'json'
};

// プロンプト生成関数
const generateInductivePrompts: PromptGenerator<InductiveInput> = (input, capability) => {
  // スキーマから動的にJSON例と注意事項を生成
  const schemaExample = generateSchemaExample(capability.outputSchema);
  const schemaInstructions = generateSchemaInstructions(capability.outputSchema);

  const systemPrompt = `あなたは帰納的思考の専門家です。観察データを分析してパターンと一般化を発見してください。

帰納的思考の手順:
1. 観察データから共通パターンを探す
2. パターンに基づいて一般化を構築する
3. 仮説を形成する
4. 信頼度を評価する

重要: 以下のJSON形式で厳密に出力してください。他のテキストは含めず、JSONのみを出力してください。

${schemaExample}

注意事項:
${schemaInstructions}

帰納的思考の本質である「個別から一般へ」の推論を重視し、慎重かつ論理的な分析を行ってください。`;

  const userPrompt = `観察データを分析してパターンと一般化を発見してください。

観察データ:
${(input.observations || []).map((obs, i) => `${i + 1}. ${obs}`).join('\n')}

${input.context ? `コンテキスト: ${input.context}` : ''}
${input.domain ? `ドメイン: ${input.domain}` : ''}

上記の観察データから共通パターンを発見し、一般化と仮説を構築してください。`;

  return E.right({ system: systemPrompt, user: userPrompt });
};

// 信頼度計算関数
const calculateInductiveConfidence: ConfidenceCalculator<InductiveOutput> = (output, _context) => {
  return pipe(
    output,
    calculateAverageConfidence,
    applySampleSizeBonus,
    normalizeConfidence
  );
};

// 平均信頼度を計算
const calculateAverageConfidence = (inductiveOutput: InductiveOutput): { inductiveOutput: InductiveOutput; avgConfidence: number } => {
  const patterns = inductiveOutput.generalizations || [];
  const avgConfidence = patterns.length > 0 
    ? patterns.reduce((sum: number, pattern: Record<string, unknown>) => sum + ((pattern.confidence as number) || 0), 0) / patterns.length
    : 0;
  return {
    inductiveOutput,
    avgConfidence
  };
};

// サンプルサイズボーナスを適用
const applySampleSizeBonus = (data: { inductiveOutput: InductiveOutput; avgConfidence: number }): { inductiveOutput: InductiveOutput; avgConfidence: number; sampleSizeBonus: number } => {
  const patternsLength = (data.inductiveOutput.generalizations || []).length;
  const sampleSizeBonus = Math.min(patternsLength * 0.02, 0.3);
  return {
    ...data,
    sampleSizeBonus
  };
};

// 信頼度を正規化
const normalizeConfidence = (data: { inductiveOutput: InductiveOutput; avgConfidence: number; sampleSizeBonus: number }): number => {
  return Math.min(data.avgConfidence + data.sampleSizeBonus, 1.0);
};

// 推論説明生成関数
const generateInductiveReasoning: ReasoningGenerator<InductiveInput, InductiveOutput> = (input, output, _context) => {
  const generalizations = output.generalizations || [];
  const observations = input.observations || [];
  
  if (generalizations.length === 0) {
    return `「${observations.length}個の観察データ」から帰納的に分析しましたが、明確なパターンを発見できませんでした。`;
  }
  
  const topGeneralization = generalizations.reduce((best, current) => 
    (current.confidence || 0) > (best.confidence || 0) ? current : best
  );
  
  return `「${observations.length}個の観察データ」から帰納的に分析し、${generalizations.length}個の一般化を発見しました。最も信頼度の高いパターンは「${topGeneralization.pattern || '未定義'}」（信頼度: ${((topGeneralization.confidence || 0) * 100).toFixed(1)}%）です。サンプルサイズ: ${output.sampleSize}、バイアス警告: ${(output.biasWarnings || []).length}個。`;
};

// 次ステップ推奨関数
const recommendInductiveNextSteps: NextStepRecommender = (_result, phase) => {
  const baseRecommendations: ThinkingMethodType[] = ['critical', 'deductive'];
  
  // 価値仮説の検証にはアブダクションも有効
  if (phase === 'value_hypothesis') {
    baseRecommendations.push('abduction');
  }
  
  // 実験段階ではメタ思考でプロセス改善
  if (phase === 'experimentation') {
    baseRecommendations.push('meta');
  }
  
  // デバッグではアブダクションも重要
  if (phase === 'debugging') {
    baseRecommendations.push('abduction');
  }

  return baseRecommendations;
};

// 関数型エージェントの定義
export const inductiveAgent: FunctionalAgent<InductiveInput, InductiveOutput> = {
  capability: inductiveCapability,
  config: inductiveConfig,
  generatePrompts: generateInductivePrompts,
  calculateConfidence: calculateInductiveConfidence,
  generateReasoning: generateInductiveReasoning,
  recommendNextSteps: recommendInductiveNextSteps,
};
