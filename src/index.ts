/**
 * @conflux/thinking-agents-mcp
 * マルチエージェント思考法ツール
 * 
 * 構造化された思考プロセスを支援するMCPツールライブラリ
 */

// 思考法スキーマのエクスポート
export * from './schemas/thinking.js';

// コアクラスのエクスポート
export { 
  BaseThinkingAgent, 
  type IThinkingAgent, 
  type AgentContext, 
  type AgentCapability,
  LLMPromptTemplate 
} from './core/agent-base.js';

export {
  LLMProviderManager,
  LLMIntegration,
  globalLLMManager,
  initializeDefaultProviders,
  type LLMProviderType,
  type LLMProviderConfig,
} from './core/llm-provider.js';

// 思考法エージェントのエクスポート
export { AbductionAgent } from './agents/abduction-agent.js';
export { LogicalThinkingAgent } from './agents/logical-agent.js';
export { CriticalThinkingAgent } from './agents/critical-agent.js';
export { MECEAgent } from './agents/mece-agent.js';
export { DeductiveThinkingAgent } from './agents/deductive-agent.js';
export { InductiveThinkingAgent } from './agents/inductive-agent.js';
export { PACThinkingAgent } from './agents/pac-agent.js';
export { MetaThinkingAgent } from './agents/meta-agent.js';
export { DebateThinkingAgent } from './agents/debate-agent.js';

// オーケストレーターのエクスポート
export { ThinkingOrchestrator } from './orchestrator/thinking-orchestrator.js';

/**
 * 使用例とクイックスタート
 */
export const examples = {
  /**
   * 基本的な使用例 - デバッグ場面での思考プロセス
   */
  async debuggingExample() {
    const { ThinkingOrchestrator } = await import('./orchestrator/thinking-orchestrator.js');
    const orchestrator = new ThinkingOrchestrator();
    
    return await orchestrator.processPhase(
      'debugging',
      {
        issue: 'APIエンドポイントが500エラーを返す',
        context: 'ユーザー登録処理で発生、ログにはDB接続エラー',
        observations: [
          'リクエストは正常に受信されている',
          'DB接続プールが満杯の状態',
          '他のエンドポイントは正常動作'
        ]
      },
      {
        llmProvider: 'default',
        sessionId: 'example-session',
      }
    );
  },

  /**
   * 要件定義での使用例
   */
  async requirementDefinitionExample() {
    const { ThinkingOrchestrator } = await import('./orchestrator/thinking-orchestrator.js');
    const orchestrator = new ThinkingOrchestrator();
    
    return await orchestrator.processPhase(
      'requirement_definition',
      {
        question: 'ユーザー管理システムに必要な機能は何か？',
        information: [
          '100人規模の組織で使用',
          'セキュリティが重要',
          '既存システムとの連携が必要'
        ],
        constraints: [
          '開発期間は3ヶ月',
          'チームは3人',
          '予算は限定的'
        ]
      },
      {
        llmProvider: 'default',
        sessionId: 'requirement-session',
      }
    );
  },

  /**
   * 黄金パターンの使用例
   */
  async goldenPatternExample() {
    const { ThinkingOrchestrator } = await import('./orchestrator/thinking-orchestrator.js');
    const orchestrator = new ThinkingOrchestrator();
    
    return await orchestrator.processGoldenPattern(
      {
        problem: '新しいeコマース機能の設計',
        context: 'モバイルファーストのアプローチが必要',
        constraints: ['パフォーマンス重視', 'SEOフレンドリー']
      },
      {
        llmProvider: 'default',
        sessionId: 'golden-session',
      }
    );
  },

  /**
   * 単一思考法の使用例 - クリティカルシンキング
   */
  async criticalThinkingExample() {
    const { ThinkingOrchestrator } = await import('./orchestrator/thinking-orchestrator.js');
    const orchestrator = new ThinkingOrchestrator();
    
    return await orchestrator.processSingleMethod(
      'critical',
      {
        claim: 'マイクロサービス化により開発速度が向上する',
        evidence: [
          'チームが独立してデプロイできる',
          '技術スタックを自由に選択できる',
          'スケーラビリティが向上する'
        ],
        context: '現在のモノリシックアーキテクチャから移行を検討中'
      },
      {
        llmProvider: 'default',
        sessionId: 'critical-session',
      }
    );
  },
};

/**
 * 推奨される使用パターン
 */
export const recommendedPatterns = {
  /**
   * 局面に応じた思考法の組み合わせ
   */
  phaseRecommendations: {
    business_exploration: ['abduction', 'inductive', 'meta'],
    requirement_definition: ['logical', 'mece', 'critical'],
    debugging: ['abduction', 'deductive', 'inductive'],
    refactoring: ['critical', 'mece', 'logical'],
    decision_making: ['debate', 'meta'],
  },

  /**
   * 思考法の連鎖パターン
   */
  chainPatterns: {
    problemSolving: ['abduction', 'deductive', 'inductive', 'critical'],
    requirementAnalysis: ['logical', 'mece', 'critical', 'meta'],
    architectureDecision: ['deductive', 'debate', 'critical', 'meta'],
  },

  /**
   * 失敗しやすいパターン（避けるべき組み合わせ）
   */
  antiPatterns: [
    'MECEだけで"正しさ"を担保しようとする',
    '演繹に寄りすぎて現実のデータで折り返さない',
    'ディベートが"勝ち負け"化し、評価軸が曖昧',
    'クリティカルが過剰で動けない',
  ],
};

/**
 * ライブラリのメタ情報
 */
export const metadata = {
  name: '@conflux/thinking-agents-mcp',
  version: '0.1.0',
  description: 'Type-safe multi-agent thinking methodology tools for strategic analysis and decision-making',
  author: 'Conflux',
  license: 'MIT',
  thinkingMethods: [
    'abduction',      // アブダクション（仮説形成）
    'logical',        // ロジカルシンキング
    'critical',       // クリティカルシンキング  
    'mece',          // MECE
    'deductive',     // 演繹的思考
    'inductive',     // 帰納的思考
    'pac',           // PAC思考
    'meta',          // メタ思考
    'debate',        // ディベート思考
  ],
  developmentPhases: [
    'business_exploration',
    'requirement_definition',
    'value_hypothesis',
    'architecture_design',
    'prioritization',
    'estimation_planning', 
    'implementation',
    'debugging',
    'refactoring',
    'code_review',
    'test_design',
    'experimentation',
    'decision_making',
    'retrospective',
    'hypothesis_breakdown',
  ],
};
