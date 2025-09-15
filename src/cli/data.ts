/**
 * CLI関連のデータとヘルパー関数
 */

import { type TaskEither } from '../core/index.js';
import * as TE from 'fp-ts/lib/TaskEither.js';
import { type DevelopmentPhase } from '../schemas/index.js';
import { type ThinkingMethodInfo, ThinkingMethodInfo as ThinkingMethodInfoSchema } from './types.js';

/**
 * 思考法一覧取得
 */
export function getThinkingMethodsList(): TaskEither<string, ThinkingMethodInfo[]> {
  const rawMethods = [
    { name: 'abduction', description: '驚きの事実から最尤説明仮説を形成', applicablePhases: ['business_exploration', 'debugging', 'experimentation'] },
    { name: 'critical', description: '前提・論点・根拠を体系的に疑い、論理の矛盾を特定', applicablePhases: ['refactoring', 'code_review', 'requirement_definition'] },
    { name: 'debate', description: '論題に対する賛成・反対の論点を体系的に検討', applicablePhases: ['decision_making', 'architecture_design'] },
    { name: 'deductive', description: '一般的な原則・理論から具体的な結論を論理的に導出', applicablePhases: ['architecture_design', 'implementation', 'debugging'] },
    { name: 'inductive', description: '個別事例から共通パターンを発見し一般論を構築', applicablePhases: ['value_hypothesis', 'experimentation', 'debugging'] },
    { name: 'logical', description: '論点から結論への論理的道筋を構築し、ピラミッド構造で整理', applicablePhases: ['requirement_definition', 'prioritization', 'estimation_planning'] },
    { name: 'mece', description: '項目を漏れなく重複なく分類し、構造化された全体像を構築', applicablePhases: ['prioritization', 'refactoring', 'code_review'] },
    { name: 'meta', description: '思考プロセス自体を対象化し、効果的な改善策を提案', applicablePhases: ['retrospective', 'estimation_planning', 'decision_making'] },
    { name: 'pac', description: '前提・仮定・結論の構造を検証し、論理的妥当性を評価', applicablePhases: ['requirement_definition', 'value_hypothesis', 'experimentation'] }
  ];

  // Zodスキーマでバリデーション
  const validatedMethods = rawMethods.map(method => {
    const result = ThinkingMethodInfoSchema.safeParse(method);
    if (result.success) {
      return result.data;
    } else {
      throw new Error(`Invalid thinking method data: ${result.error.message}`);
    }
  });

  return TE.right(validatedMethods);
}

/**
 * 局面別推奨思考法取得
 * 思考法の使い方.mdの「併用すると強い」思考法を詳細に反映
 */
export function getPhaseRecommendations(phase: DevelopmentPhase): string[] {
  const recommendations: Record<DevelopmentPhase, string[]> = {
    business_exploration: ['abduction', 'inductive', 'deductive', 'meta'],
    requirement_definition: ['logical', 'mece', 'critical', 'pac'],
    value_hypothesis: ['inductive', 'critical', 'abduction', 'meta'],
    architecture_design: ['deductive', 'debate', 'logical', 'critical'],
    prioritization: ['mece', 'logical', 'meta'],
    estimation_planning: ['logical', 'meta', 'inductive'],
    implementation: ['deductive', 'critical', 'logical'],
    debugging: ['abduction', 'deductive', 'inductive', 'critical'],
    refactoring: ['critical', 'mece', 'logical'],
    code_review: ['critical', 'deductive', 'mece'],
    test_design: ['deductive', 'mece', 'inductive'],
    experimentation: ['inductive', 'critical', 'abduction', 'meta'],
    decision_making: ['debate', 'meta', 'logical'],
    retrospective: ['meta', 'logical', 'pac'],
    hypothesis_breakdown: ['pac', 'critical', 'deductive']
  };
  
  return recommendations[phase] || [];
}
