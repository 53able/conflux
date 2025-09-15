import { readFileSync } from 'fs';
import { z } from 'zod';
import { SERVER_CONFIG } from './constants.js';
import * as E from 'fp-ts/lib/Either.js';

/**
 * package.jsonのZodスキーマ
 */
const PackageJsonSchema = z.object({
  version: z.string(),
  name: z.string(),
}).catchall(z.unknown());

/**
 * package.jsonの型定義（Zodスキーマから導出）
 */
type PackageJson = z.infer<typeof PackageJsonSchema>;

/**
 * バージョン情報取得（Zodスキーマファースト版）
 */
export function getVersion(): string {
  return E.fold(
    () => SERVER_CONFIG.VERSION,
    (packageJson: PackageJson) => packageJson.version || SERVER_CONFIG.VERSION
  )(
    E.tryCatch(
      () => {
        const parsed = JSON.parse(readFileSync('package.json', 'utf-8'));
        return PackageJsonSchema.parse(parsed);
      },
      () => null
    )
  );
}

/**
 * 思考法のZodスキーマ
 */
const ThinkingMethodSchema = z.object({
  name: z.string(),
  description: z.string(),
  applicablePhases: z.array(z.string()),
});

/**
 * 思考法の型定義（Zodスキーマから導出）
 */
type ThinkingMethod = z.infer<typeof ThinkingMethodSchema>;

/**
 * 思考法一覧のZodスキーマ
 */
const ThinkingMethodsListSchema = z.array(ThinkingMethodSchema);

/**
 * 思考法一覧を取得（Zodスキーマファースト版）
 */
export function getThinkingMethodsList(): readonly ThinkingMethod[] {
  const methods = [
    {
      name: 'abduction',
      description: '驚きの事実から最尤説明仮説を形成',
      applicablePhases: ['business_exploration', 'debugging', 'experimentation'] },
    {
      name: 'critical',
      description: '前提・論点・根拠を体系的に疑い、論理の矛盾を特定',
      applicablePhases: ['refactoring', 'code_review', 'requirement_definition'] },
    {
      name: 'debate',
      description: '論題に対する賛成・反対の論点を体系的に検討',
      applicablePhases: ['decision_making', 'architecture_design']
    },
    {
      name: 'deductive',
      description: '一般的な原則・理論から具体的な結論を論理的に導出',
      applicablePhases: ['architecture_design', 'implementation', 'debugging']
    },
    {
      name: 'inductive',
      description: '個別事例から共通パターンを発見し一般論を構築',
      applicablePhases: ['value_hypothesis', 'experimentation', 'debugging']
    },
    {
      name: 'logical',
      description: '論点から結論への論理的道筋を構築し、ピラミッド構造で整理',
      applicablePhases: ['requirement_definition', 'prioritization', 'estimation_planning']
    },
    {
      name: 'mece',
      description: '項目を漏れなく重複なく分類し、構造化された全体像を構築',
      applicablePhases: ['prioritization', 'refactoring', 'code_review']
      },
    {
      name: 'meta',
      description: '思考プロセス自体を対象化し、効果的な改善策を提案',
      applicablePhases: ['retrospective', 'estimation_planning', 'decision_making'] 
    },
    {
      name: 'pac',
      description: '前提・仮定・結論の構造を検証し、論理的妥当性を評価',
      applicablePhases: ['requirement_definition', 'value_hypothesis', 'experimentation'] 
    }
  ] as const;

  // ランタイムでZodスキーマによる検証
  const parsed = ThinkingMethodsListSchema.safeParse(methods);
  if (!parsed.success) {
    throw new Error(`Invalid thinking methods list: ${parsed.error.message}`);
  }
  return parsed.data;
}

/**
 * 局面別推奨思考法のZodスキーマ
 */
const PhaseRecommendationsSchema = z.object({
  business_exploration: z.array(z.string()).describe('ビジネス探索の推奨思考法'),
  requirement_definition: z.array(z.string()).describe('要件定義の推奨思考法'),
  value_hypothesis: z.array(z.string()).describe('価値仮説の推奨思考法'),
  architecture_design: z.array(z.string()).describe('アーキテクチャ設計の推奨思考法'),
  prioritization: z.array(z.string()).describe('優先順位付けの推奨思考法'),
  estimation_planning: z.array(z.string()).describe('見積もり計画の推奨思考法'),
  implementation: z.array(z.string()).describe('実装の推奨思考法'),
  debugging: z.array(z.string()).describe('デバッグの推奨思考法'),
  refactoring: z.array(z.string()).describe('リファクタリングの推奨思考法'),
  code_review: z.array(z.string()).describe('コードレビューの推奨思考法'),
  test_design: z.array(z.string()).describe('テスト設計の推奨思考法'),
  experimentation: z.array(z.string()).describe('実験の推奨思考法'),
  decision_making: z.array(z.string()).describe('意思決定の推奨思考法'),
  retrospective: z.array(z.string()).describe('振り返りの推奨思考法'),
  hypothesis_breakdown: z.array(z.string()).describe('仮説分解の推奨思考法'),
});

/**
 * 局面別推奨思考法の型定義（Zodスキーマから導出）
 */
type PhaseRecommendations = z.infer<typeof PhaseRecommendationsSchema>;

/**
 * 局面別推奨思考法を取得（Zodスキーマファースト版）
 * 思考法の使い方.mdの「併用すると強い」思考法を詳細に反映
 */
export function getPhaseRecommendations(): PhaseRecommendations {
  const recommendations = {
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
  } as const;
  
  // ランタイムでZodスキーマによる検証
  const parsed = PhaseRecommendationsSchema.safeParse(recommendations);
  if (!parsed.success) {
    throw new Error(`Invalid phase recommendations: ${parsed.error.message}`);
  }
  return parsed.data;
}
