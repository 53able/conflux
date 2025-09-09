import { 
  ThinkingMethodType, 
  DevelopmentPhase, 
  ThinkingResult, 
  IntegratedThinkingResult,
  ThinkingProcessStatus 
} from '../schemas/thinking.js';
import { type IThinkingAgent, type AgentContext } from '../core/agent-base.js';

// 思考法エージェントのインポート
import { AbductionAgent } from '../agents/abduction-agent.js';
import { LogicalThinkingAgent } from '../agents/logical-agent.js';
import { CriticalThinkingAgent } from '../agents/critical-agent.js';
import { MECEAgent } from '../agents/mece-agent.js';
import { DeductiveThinkingAgent } from '../agents/deductive-agent.js';
import { InductiveThinkingAgent } from '../agents/inductive-agent.js';
import { PACThinkingAgent } from '../agents/pac-agent.js';
import { MetaThinkingAgent } from '../agents/meta-agent.js';
import { DebateThinkingAgent } from '../agents/debate-agent.js';

/**
 * 思考法オーケストレーション戦略
 */
interface OrchestrationStrategy {
  primary: ThinkingMethodType;           // 主要思考法
  secondary: ThinkingMethodType[];       // 併用思考法
  sequence?: ThinkingMethodType[];       // 実行順序（指定時）
  maxIterations?: number;                // 最大反復回数
}

/**
 * 局面別思考法マッピング
 * 思考法の使い方.mdの早見表を基に実装
 */
const PHASE_THINKING_MAP: Record<DevelopmentPhase, OrchestrationStrategy> = {
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

/**
 * 黄金パターン（探索→実装）のシーケンス
 * 思考法の使い方.mdの併用黄金パターンを実装
 */
const GOLDEN_PATTERN_SEQUENCE: ThinkingMethodType[] = [
  'abduction',  // 仮説を立てる
  'deductive',  // 帰結を設計
  'inductive',  // データ検証
  'critical',   // 前提/飛躍を潰す
  'logical',    // 成果物に構造を与える (MECE含む)
  'meta',       // プロセス自体を更新
  'debate',     // 必要なら意思決定を締める
];

/**
 * マルチエージェント思考オーケストレーター
 * 
 * 責務:
 * 1. 局面に応じた思考法の自動選択
 * 2. エージェント間の連携管理
 * 3. 思考プロセスの統合と最適化
 * 4. 黄金パターンの実行
 */
export class ThinkingOrchestrator {
  private agents: Map<ThinkingMethodType, IThinkingAgent> = new Map();

  constructor() {
    this.initializeAgents();
  }

  /**
   * 全エージェントを初期化
   */
  private initializeAgents(): void {
    this.agents.set('abduction', new AbductionAgent());
    this.agents.set('logical', new LogicalThinkingAgent());
    this.agents.set('critical', new CriticalThinkingAgent());
    this.agents.set('mece', new MECEAgent());
    this.agents.set('deductive', new DeductiveThinkingAgent());
    this.agents.set('inductive', new InductiveThinkingAgent());
    this.agents.set('pac', new PACThinkingAgent());
    this.agents.set('meta', new MetaThinkingAgent());
    this.agents.set('debate', new DebateThinkingAgent());
  }

  /**
   * 局面に応じた統合思考プロセスを実行
   */
  async processPhase(
    phase: DevelopmentPhase,
    initialInput: Record<string, unknown>,
    context: AgentContext
  ): Promise<IntegratedThinkingResult> {
    const strategy = PHASE_THINKING_MAP[phase];
    const results: ThinkingResult[] = [];
    
    try {
      // 戦略に基づいてシーケンシャルに実行
      if (strategy.sequence) {
        let currentInput = initialInput;
        
        for (const methodType of strategy.sequence) {
          const agent = this.agents.get(methodType);
          if (!agent) continue;
          
          // エージェントを実行
          const result = await agent.think(currentInput, {
            ...context,
            previousResults: results,
            metadata: { ...context.metadata, phase },
          });
          
          results.push(result);
          
          // 次のエージェントの入力として結果を使用（必要に応じて）
          if (result.output) {
            currentInput = { ...currentInput, previousResult: result.output };
          }
          
          // エラーが発生した場合の処理
          if (result.status === 'failed') {
            console.warn(`Agent ${methodType} failed: ${result.reasoning}`);
          }
        }
      } else {
        // 並列実行（主要思考法のみ）
        const primaryAgent = this.agents.get(strategy.primary);
        if (primaryAgent) {
          const result = await primaryAgent.think(initialInput, {
            ...context,
            metadata: { ...context.metadata, phase },
          });
          results.push(result);
        }
      }

      // 結果の統合と分析
      return this.synthesizeResults(phase, strategy, results, initialInput);

    } catch (error) {
      // エラー処理
      console.error(`Orchestration failed for phase ${phase}:`, error);
      return this.createFailureResult(phase, strategy, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * 黄金パターン（探索→実装）を実行
   */
  async processGoldenPattern(
    initialInput: Record<string, unknown>,
    context: AgentContext
  ): Promise<IntegratedThinkingResult> {
    const results: ThinkingResult[] = [];
    let currentInput = initialInput;

    for (const methodType of GOLDEN_PATTERN_SEQUENCE) {
      const agent = this.agents.get(methodType);
      if (!agent) continue;

      try {
        const result = await agent.think(currentInput, {
          ...context,
          previousResults: results,
          metadata: { ...context.metadata, goldenPattern: true },
        });
        
        results.push(result);
        
        // 失敗した場合はスキップして次へ
        if (result.status === 'failed') {
          console.warn(`Golden pattern step ${methodType} failed, continuing...`);
          continue;
        }
        
        // 成功した結果を次の入力として使用
        if (result.output) {
          currentInput = { ...currentInput, [methodType]: result.output };
        }
        
      } catch (error) {
        console.error(`Golden pattern step ${methodType} error:`, error);
      }
    }

    return this.synthesizeResults('business_exploration', {
      primary: 'abduction',
      secondary: GOLDEN_PATTERN_SEQUENCE.slice(1),
      sequence: GOLDEN_PATTERN_SEQUENCE,
    }, results, initialInput);
  }

  /**
   * 単一思考法を実行
   */
  async processSingleMethod(
    methodType: ThinkingMethodType,
    input: Record<string, unknown>,
    context: AgentContext
  ): Promise<ThinkingResult> {
    const agent = this.agents.get(methodType);
    if (!agent) {
      throw new Error(`Agent not found for method: ${methodType}`);
    }

    return agent.think(input, context);
  }

  /**
   * 結果の統合と分析
   */
  private synthesizeResults(
    phase: DevelopmentPhase,
    strategy: OrchestrationStrategy,
    results: ThinkingResult[],
    originalInput: Record<string, unknown>
  ): IntegratedThinkingResult {
    const successfulResults = results.filter(r => r.status === 'completed');
    const failedCount = results.length - successfulResults.length;
    
    // 全体的な信頼度を計算
    const avgConfidence = successfulResults.length > 0 
      ? successfulResults.reduce((sum, r) => sum + r.confidence, 0) / successfulResults.length
      : 0;

    // 統合分析を生成
    const synthesis = this.generateSynthesis(strategy, successfulResults, failedCount);
    
    // アクションアイテムを抽出
    const actionItems = this.extractActionItems(successfulResults);
    
    // 次のステップを推奨
    const nextSteps = this.recommendNextSteps(phase, successfulResults);

    return {
      phase,
      primaryMethod: strategy.primary,
      secondaryMethods: strategy.secondary,
      results,
      synthesis,
      actionItems,
      confidence: Math.max(0, avgConfidence - (failedCount * 0.1)), // 失敗したエージェント分減点
      nextSteps,
    };
  }

  /**
   * 統合分析テキストを生成
   */
  private generateSynthesis(
    strategy: OrchestrationStrategy,
    results: ThinkingResult[],
    failedCount: number
  ): string {
    const methodNames = [strategy.primary, ...strategy.secondary].join('、');
    const successCount = results.length;
    
    let synthesis = `${methodNames}の思考法を組み合わせて分析を実行しました。`;
    synthesis += `成功: ${successCount}個、失敗: ${failedCount}個のエージェントが処理を完了しました。\n\n`;
    
    // 各思考法の主要な洞察を統合
    results.forEach(result => {
      if (result.reasoning) {
        synthesis += `■ ${result.method}: ${result.reasoning}\n`;
      }
    });
    
    return synthesis;
  }

  /**
   * アクションアイテムを抽出
   */
  private extractActionItems(results: ThinkingResult[]): string[] {
    const actionItems: string[] = [];
    
    results.forEach(result => {
      if (result.output) {
        // 各思考法の特性に応じてアクションアイテムを抽出
        switch (result.method) {
          case 'critical':
            const criticalOutput = result.output as any;
            if (criticalOutput.recommendations) {
              actionItems.push(...criticalOutput.recommendations);
            }
            break;
          case 'abduction':
            const abductionOutput = result.output as any;
            if (abductionOutput.hypotheses) {
              const topHypothesis = abductionOutput.hypotheses[0];
              if (topHypothesis?.testablePredicitions) {
                actionItems.push(...topHypothesis.testablePredicitions.map((p: string) => `検証: ${p}`));
              }
            }
            break;
          case 'meta':
            const metaOutput = result.output as any;
            if (metaOutput.recommendations) {
              actionItems.push(...metaOutput.recommendations.map((r: any) => `${r.aspect}: ${r.improvement}`));
            }
            break;
        }
      }
    });
    
    return [...new Set(actionItems)]; // 重複を除去
  }

  /**
   * 次ステップを推奨
   */
  private recommendNextSteps(phase: DevelopmentPhase, results: ThinkingResult[]): string[] {
    const nextSteps: string[] = [];
    
    // 各結果から次の推奨思考法を収集
    results.forEach(result => {
      if (result.nextRecommendations) {
        result.nextRecommendations.forEach(method => {
          nextSteps.push(`${method}思考による追加分析を検討`);
        });
      }
    });
    
    // 局面固有の次ステップを追加
    switch (phase) {
      case 'requirement_definition':
        nextSteps.push('要件の優先順位付け（prioritization）への移行');
        break;
      case 'debugging':
        nextSteps.push('修正実装（implementation）への移行');
        break;
      case 'refactoring':
        nextSteps.push('コードレビュー（code_review）による検証');
        break;
    }
    
    return [...new Set(nextSteps)].slice(0, 5); // 重複除去と上位5個に限定
  }

  /**
   * 失敗結果の作成
   */
  private createFailureResult(phase: DevelopmentPhase, strategy: OrchestrationStrategy, error: string): IntegratedThinkingResult {
    return {
      phase,
      primaryMethod: strategy.primary,
      secondaryMethods: strategy.secondary,
      results: [],
      synthesis: `統合思考プロセスでエラーが発生しました: ${error}`,
      actionItems: ['エラーの原因を調査', '入力データの再確認', '個別思考法での再試行'],
      confidence: 0,
      nextSteps: ['問題の修正後に再実行'],
    };
  }
}
