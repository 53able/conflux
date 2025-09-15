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
import { type MECEInput, type MECEOutput, MECEInputSchema, MECEOutputSchema  } from '../schemas/index.js';

/**
 * MECE思考エージェント（関数型スタイル）
 * 
 * 機能:
 * 1. 情報収集の目的を設定する
 * 2. 情報収集の切り口を決める
 * 3. 漏れとダブりをチェックする
 * 
 * 適用場面:
 * - 優先順位付け（バックログ整列）
 * - リファクタリング（影響範囲洗い出し）
 * - コードレビュー（観点漏れ防止）
 * - テスト設計（同値分割・境界網羅）
 */

// ============================================================================
// 関数型スタイルのMECE思考エージェント
// ============================================================================



// エージェント能力定義
const meceCapability: AgentCapability = {
  methodType: 'mece' as ThinkingMethodType,
  description: '漏れなく重複なく分類・整理する',
  applicablePhases: [
    'prioritization',
    'refactoring',
    'code_review',
    'test_design'
  ] as DevelopmentPhase[],
  requiredInputSchema: MECEInputSchema,
  outputSchema: MECEOutputSchema,
  combinationSynergies: ['logical', 'critical', 'deductive', 'meta'],
};

// エージェント設定
const meceConfig: AgentConfig = {
  temperature: 0.2,
  maxRetries: 3,
  enableAutoRecovery: true,
  schemaName: 'MECEOutput',
  schemaDescription: 'MECE思考の分析結果を表す構造化データ',
  mode: 'json'
};

// プロンプト生成関数
const generateMECEPrompts: PromptGenerator<MECEInput> = (input, capability) => {
  // スキーマから統合された要件を生成
  const schemaRequirements = extractSchemaRequirements(capability.outputSchema);

  const systemPrompt = `あなたはMECE思考の専門家です。情報を漏れなく重複なく分類・整理してください。

MECE思考の手順:
1. 目的を明確にする
2. 分類基準を設定する
3. 項目を分類する
4. 漏れとダブりをチェックする

重要: 以下のJSON形式で厳密に出力してください。他のテキストは含めず、JSONのみを出力してください。

${schemaRequirements}

MECE思考の本質である「Mutually Exclusive, Collectively Exhaustive」を重視し、体系的で完全な分類を行ってください。`;

  const userPrompt = `以下の項目をMECE思考により分類・整理してください。

目的:
${input.purpose}

項目:
${(input.items || []).map((item, i) => `${i + 1}. ${item}`).join('\n')}

${input.proposedCriteria ? `提案された分類基準: ${input.proposedCriteria}` : ''}

上記の項目を漏れなく重複なく分類し、見つかった漏れや重複も報告してください。`;

  return E.right({ system: systemPrompt, user: userPrompt });
};

// 信頼度計算関数
const calculateMECEConfidence: ConfidenceCalculator<MECEOutput> = (output, _context) => {
  // MECEの信頼度は分類の完全性と一貫性に基づく
  const _totalItems = (output.categories || []).reduce((sum, cat) => sum + (cat.items || []).length, 0);
  const gaps = (output.gaps || []).length;
  const overlaps = (output.overlaps || []).length;
  
  // 漏れと重複が少ないほど信頼度が高い
  const completenessBonus = Math.max(0, 1 - (gaps + overlaps) * 0.1);
  const baseConfidence = output.completenessScore || 0;
  
  return Math.min(baseConfidence * completenessBonus, 1.0);
};

// 推論説明生成関数
const generateMECEReasoning: ReasoningGenerator<MECEInput, MECEOutput> = (input, output, _context) => {
  return `「${input.purpose}」を目的として、${(input.items || []).length}個の項目を${(output.categories || []).length}個のカテゴリに分類しました。分類基準: ${output.criteria || '未設定'}。漏れ: ${(output.gaps || []).length}個、重複: ${(output.overlaps || []).length}個を特定し、MECE原則に基づく体系的な整理を実現しました（完全性スコア: ${((output.completenessScore || 0) * 100).toFixed(1)}%）`;
};

// 次ステップ推奨関数
const recommendMECENextSteps: NextStepRecommender = (_result, phase) => {
  const baseRecommendations: ThinkingMethodType[] = ['logical', 'critical'];
  
  // 優先順位付けではメタ思考も有効
  if (phase === 'prioritization') {
    baseRecommendations.push('meta');
  }
  
  // テスト設計では演繹的思考と帰納的思考も重要
  if (phase === 'test_design') {
    baseRecommendations.push('deductive', 'inductive');
  }
  
  // コードレビューでは演繹的思考も重要
  if (phase === 'code_review') {
    baseRecommendations.push('deductive');
  }

  return baseRecommendations;
};

// 関数型エージェントの定義
export const meceAgent: FunctionalAgent<MECEInput, MECEOutput> = {
  capability: meceCapability,
  config: meceConfig,
  generatePrompts: generateMECEPrompts,
  calculateConfidence: calculateMECEConfidence,
  generateReasoning: generateMECEReasoning,
  recommendNextSteps: recommendMECENextSteps,
};
