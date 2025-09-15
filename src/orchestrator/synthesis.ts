import {
  type ThinkingMethodType,
  type DevelopmentPhase,
  type ThinkingResult,
  type IntegratedThinkingResult,
  type AbductionOutput,
  type CriticalOutput,
  type MECEOutput,
  type LogicalOutput,
  type DeductiveOutput,
  type InductiveOutput,
  type PACOutput,
  type MetaOutput,
  type DebateOutput
} from '../schemas/index.js';
import * as E from 'fp-ts/lib/Either.js';
import * as O from 'fp-ts/lib/Option.js';
import * as A from 'fp-ts/lib/Array.js';
import * as Eq from 'fp-ts/lib/Eq.js';
import { pipe } from 'fp-ts/lib/function.js';
import type { OrchestrationStrategy } from './strategy.js';

/**
 * 結果の統合と分析
 */
export function synthesizeResults(
  phase: DevelopmentPhase,
  strategy: OrchestrationStrategy,
  results: ThinkingResult[],
  _originalInput: Record<string, unknown>
): E.Either<string, IntegratedThinkingResult> {
  return E.tryCatch(
    () => {
      const successfulResults = filterSuccessfulResults(results);
      const confidenceData = calculateConfidence(successfulResults);
      const synthesis = generateSynthesis(strategy)(confidenceData);
      const actionItems = extractActionItems(synthesis);
      const nextSteps = recommendNextSteps(phase, results)(actionItems);
      const integratedResult = createIntegratedResult(phase, strategy, results)(nextSteps);
      
      return integratedResult;
    },
    (error) => error instanceof Error ? error.message : 'Unknown error'
  );
}

/**
 * 成功した結果のみをフィルタリング（関数型版）
 */
const filterSuccessfulResults = (results: ThinkingResult[]): ThinkingResult[] => {
  return results.filter((r: ThinkingResult) => r.status === 'completed');
};

/**
 * 信頼度を計算（関数型版）
 */
const calculateConfidence = (successfulResults: ThinkingResult[]): { successfulResults: ThinkingResult[]; avgConfidence: number; failedCount: number } => {
  const avgConfidence = pipe(
    successfulResults,
    A.map(r => r.confidence),
    A.reduce(0, (sum, confidence) => sum + confidence),
    sum => successfulResults.length > 0 ? sum / successfulResults.length : 0
  );
  
  return {
    successfulResults,
    avgConfidence,
    failedCount: 0 // この時点では失敗数は不明
  };
};

/**
 * 統合分析を生成
 */
const generateSynthesis = (strategy: OrchestrationStrategy) => 
  (data: { successfulResults: ThinkingResult[]; avgConfidence: number; failedCount: number }): { 
    successfulResults: ThinkingResult[]; 
    avgConfidence: number; 
    failedCount: number; 
    synthesis: string 
  } => {
    const methodNames = [strategy.primary, ...strategy.secondary].join('、');
    const successCount = data.successfulResults.length;
    
    const synthesis = pipe(
      `${methodNames}の思考法を組み合わせて分析を実行しました。`,
      base => `${base}成功: ${successCount}個、失敗: ${data.failedCount}個のエージェントが処理を完了しました。\n\n`
    );
    
    // 各思考法の主要な洞察を統合（関数型版）
    const insights = pipe(
      data.successfulResults,
      A.filterMap((result: ThinkingResult) => 
        result.reasoning ? O.some(`■ ${result.method}: ${result.reasoning}`) : O.none
      ),
      A.map((insight: string) => insight + '\n'),
      A.reduce('', (acc, insight) => acc + insight)
    );
    
    const finalSynthesis = synthesis + insights;
    
    return {
      ...data,
      synthesis: finalSynthesis
    };
  };

/**
 * 統合結果を作成
 */
const createIntegratedResult = (phase: DevelopmentPhase, strategy: OrchestrationStrategy, results: ThinkingResult[]) => 
  (data: { 
    successfulResults: ThinkingResult[]; 
    avgConfidence: number; 
    failedCount: number; 
    synthesis: string; 
    actionItems: string[]; 
    nextSteps: string[] 
  }): IntegratedThinkingResult => {
    return {
      phase,
      primaryMethod: strategy.primary,
      secondaryMethods: strategy.secondary,
      results,
      synthesis: data.synthesis,
      actionItems: data.actionItems,
      confidence: Math.max(0, data.avgConfidence - (data.failedCount * 0.1)),
      nextSteps: data.nextSteps,
      timestamp: new Date().toISOString()
    };
  };

/**
 * アクションアイテムを抽出
 */
const extractActionItems = (data: { 
  successfulResults: ThinkingResult[]; 
  avgConfidence: number; 
  failedCount: number; 
  synthesis: string 
}): { 
  successfulResults: ThinkingResult[]; 
  avgConfidence: number; 
  failedCount: number; 
  synthesis: string; 
  actionItems: string[] 
} => {
  const actionItems = pipe(
    data.successfulResults,
    A.filterMap((result: ThinkingResult) => 
      result.output ? O.some(result) : O.none
    ),
    A.chain((result: ThinkingResult) => extractActionItemsFromResult(result))
  );
  
  return {
    ...data,
    actionItems
  };
};

/**
 * 個別の結果からアクションアイテムを抽出（関数型版）
 */
const extractActionItemsFromResult = (result: ThinkingResult): string[] => {
  const extractor = (method: string, output: Record<string, unknown>): string[] => {
    switch (method) {
      case 'critical': {
        const criticalOutput = output as CriticalOutput;
        return criticalOutput.questioningResults?.assumptionChallenges
          ? [`前提を検証: ${criticalOutput.questioningResults.assumptionChallenges.join(', ')}`]
          : [];
      }
      case 'mece': {
        const meceOutput = output as MECEOutput;
        return meceOutput.categories
          ? [`MECE分類を適用: ${meceOutput.categories.map(cat => cat.name).join(', ')}`]
          : [];
      }
      case 'logical': {
        const logicalOutput = output as LogicalOutput;
        return logicalOutput.conclusion
          ? [`論理的結論を検証: ${logicalOutput.conclusion}`]
          : [];
      }
      case 'abduction': {
        const abductionOutput = output as AbductionOutput;
        return abductionOutput.hypotheses
          ? [`仮説を検証: ${abductionOutput.hypotheses.join(', ')}`]
          : [];
      }
      case 'deductive': {
        const deductiveOutput = output as DeductiveOutput;
        return deductiveOutput.conclusion
          ? [`演繹的結論を検証: ${deductiveOutput.conclusion}`]
          : [];
      }
      case 'inductive': {
        const inductiveOutput = output as InductiveOutput;
        return inductiveOutput.generalizations
          ? [`帰納的パターンを検証: ${inductiveOutput.generalizations.map(g => g.pattern).join(', ')}`]
          : [];
      }
      case 'pac': {
        const pacOutput = output as PACOutput;
        return pacOutput.conclusion
          ? [`PAC分析を検証: ${pacOutput.conclusion}`]
          : [];
      }
      case 'meta': {
        const metaOutput = output as MetaOutput;
        return metaOutput.recommendations
          ? [`メタ思考の改善点: ${metaOutput.recommendations.map(r => r.improvement).join(', ')}`]
          : [];
      }
      case 'debate': {
        const debateOutput = output as DebateOutput;
        return debateOutput.recommendation
          ? [`ディベート分析を検証: ${debateOutput.recommendation.decision} - ${debateOutput.recommendation.reasoning}`]
          : [];
      }
      default:
        return [];
    }
  };

  return extractor(result.method, result.output as Record<string, unknown>);
};

/**
 * 局面固有の次ステップを取得（関数型版）
 */
const getPhaseSpecificNextSteps = (phase: DevelopmentPhase): string[] => {
  const phaseSteps: Record<DevelopmentPhase, string[]> = {
    requirement_definition: ['要件の優先順位付け（prioritization）への移行'],
    debugging: ['修正実装（implementation）への移行'],
    refactoring: ['コードレビュー（code_review）による検証'],
    business_exploration: [],
    value_hypothesis: [],
    architecture_design: [],
    prioritization: [],
    estimation_planning: [],
    implementation: [],
    code_review: [],
    test_design: [],
    experimentation: [],
    decision_making: [],
    retrospective: [],
    hypothesis_breakdown: []
  };

  return phaseSteps[phase] || [];
};

/**
 * 次ステップを推奨
 */
const recommendNextSteps = (phase: DevelopmentPhase, results: ThinkingResult[]) => 
  (data: { 
    successfulResults: ThinkingResult[]; 
    avgConfidence: number; 
    failedCount: number; 
    synthesis: string; 
    actionItems: string[] 
  }): { 
    successfulResults: ThinkingResult[]; 
    avgConfidence: number; 
    failedCount: number; 
    synthesis: string; 
    actionItems: string[]; 
    nextSteps: string[] 
  } => {
    // 各結果から次の推奨思考法を収集（関数型版）
    const recommendationSteps = pipe(
      results,
      A.filterMap((result: ThinkingResult) => 
        result.nextRecommendations ? O.some(result.nextRecommendations) : O.none
      ),
      A.chain((recommendations: string[]) => recommendations),
      A.map(method => `${method}思考による追加分析を検討`)
    );
    
    // 局面固有の次ステップを追加（関数型版）
    const phaseSpecificSteps = getPhaseSpecificNextSteps(phase);
    
    const allSteps = [...recommendationSteps, ...phaseSpecificSteps];
    
    return {
      ...data,
      nextSteps: pipe(
        allSteps,
        A.uniq(Eq.eqString),
        A.takeLeft(5) // 上位5個に限定
      )
    };
  };

/**
 * スキーマガイダンス結果の作成
 */
export function createSchemaGuidanceResult(
  phase: DevelopmentPhase, 
  strategy: OrchestrationStrategy, 
  failedResult: ThinkingResult,
  failedMethodType: ThinkingMethodType,
  results: ThinkingResult[] = []
): IntegratedThinkingResult {
  return {
    phase,
    primaryMethod: strategy.primary,
    secondaryMethods: strategy.secondary,
    results: [failedResult],
    synthesis: `多段階思考プロセス中に${failedMethodType}エージェントで入力データの不正が検出されました。推奨スキーマに従って入力データを修正し、同じ思考プロセスを再実行してください。\n\n使用するMCPツール: process-phase\n\n実行済み思考法: ${results.length > 1 ? results.slice(0, -1).map(r => r.method).join(', ') + ' → ' + failedMethodType : failedMethodType}`,
    actionItems: [
      '入力データを推奨スキーマに従って修正してください',
      `修正後、process-phaseツールで同じ思考プロセスを再実行してください（実行済み: ${results.length > 1 ? results.slice(0, -1).map(r => r.method).join(', ') + ' → ' + failedMethodType : failedMethodType}）`
    ],
    confidence: 0.0,
    nextSteps: [
      '入力データの修正',
      `process-phaseツールでの思考プロセス再実行（失敗箇所: ${failedMethodType}）`
    ],
    timestamp: new Date().toISOString()
  };
}

/**
 * 失敗結果の作成
 */
export function createFailureResult(phase: DevelopmentPhase, strategy: OrchestrationStrategy, error: string): IntegratedThinkingResult {
  return {
    phase,
    primaryMethod: strategy.primary,
    secondaryMethods: strategy.secondary,
    results: [],
    synthesis: `統合思考プロセスでエラーが発生しました: ${error}`,
    actionItems: ['エラーの原因を調査', '入力データの再確認', '個別思考法での再試行'],
    confidence: 0,
    nextSteps: ['問題の修正後に再実行'],
    timestamp: new Date().toISOString()
  };
}
