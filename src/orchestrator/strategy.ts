import { ThinkingMethodType, DevelopmentPhase } from '../schemas/index.js';

/**
 * 思考法オーケストレーション戦略
 */
export interface OrchestrationStrategy {
  primary: ThinkingMethodType;           // 主要思考法
  secondary: ThinkingMethodType[];       // 併用思考法
  sequence?: ThinkingMethodType[];       // 実行順序（指定時）
  maxIterations?: number;                // 最大反復回数
}

/**
 * 局面別思考法マッピング
 * 思考法の使い方.mdの早見表を基に実装
 */
export const PHASE_THINKING_MAP: Record<DevelopmentPhase, OrchestrationStrategy> = {
  business_exploration: {
    primary: 'abduction',
    secondary: ['inductive', 'deductive', 'meta'],
    sequence: ['abduction', 'inductive', 'deductive', 'meta'],
  },
  requirement_definition: {
    primary: 'logical',
    secondary: ['mece', 'critical'],
    sequence: ['logical', 'mece', 'critical'],
  },
  value_hypothesis: {
    primary: 'inductive',
    secondary: ['critical'],
    sequence: ['inductive', 'critical'],
  },
  architecture_design: {
    primary: 'deductive',
    secondary: ['debate'],
    sequence: ['deductive', 'debate'],
  },
  prioritization: {
    primary: 'mece',
    secondary: ['logical'],
    sequence: ['mece', 'logical'],
  },
  estimation_planning: {
    primary: 'logical',
    secondary: ['meta'],
    sequence: ['logical', 'meta'],
  },
  implementation: {
    primary: 'deductive',
    secondary: ['critical'],
    sequence: ['deductive', 'critical'],
  },
  debugging: {
    primary: 'abduction',
    secondary: ['deductive', 'inductive'],
    sequence: ['abduction', 'deductive', 'inductive'],
  },
  refactoring: {
    primary: 'critical',
    secondary: ['mece', 'logical'],
    sequence: ['critical', 'mece', 'logical'],
  },
  code_review: {
    primary: 'critical',
    secondary: ['deductive', 'mece'],
    sequence: ['critical', 'deductive', 'mece'],
  },
  test_design: {
    primary: 'deductive',
    secondary: ['mece', 'inductive'],
    sequence: ['deductive', 'mece', 'inductive'],
  },
  experimentation: {
    primary: 'inductive',
    secondary: ['critical'],
    sequence: ['inductive', 'critical'],
  },
  decision_making: {
    primary: 'debate',
    secondary: ['meta'],
    sequence: ['debate', 'meta'],
  },
  retrospective: {
    primary: 'meta',
    secondary: ['logical', 'pac'],
    sequence: ['meta', 'logical', 'pac'],
  },
  hypothesis_breakdown: {
    primary: 'pac',
    secondary: ['critical'],
    sequence: ['pac', 'critical'],
  },
};
