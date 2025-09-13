import { 
  ThinkingMethodType, 
  DevelopmentPhase, 
  ThinkingResult, 
  IntegratedThinkingResult,
  AbductionOutput,
  CriticalOutput,
  MetaOutput
} from '../schemas/thinking.js';
import { type IThinkingAgent, type AgentContext } from '../core/agent-base.js';
import { Logger } from '../core/logger.js';

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
  private logger = Logger.getInstance();

  constructor() {
    this.initializeAgents();
    this.logger.info('ThinkingOrchestrator initialized', { 
      agentCount: this.agents.size 
    });
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
        
        for (let i = 0; i < strategy.sequence.length; i++) {
          const methodType = strategy.sequence[i];
          const agent = this.agents.get(methodType);
          if (!agent) continue;
          
          // 入力形式を変換
          const convertedInput = this.convertInputForMethod(methodType, currentInput, phase);
          
          // エージェントを実行
          const result = await agent.think(convertedInput, {
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
            this.logger.warn('Agent execution failed', {
              methodType,
              reasoning: result.reasoning,
              phase,
              strategy
            });
            
            // スキーマガイダンスが含まれている場合は、それを含めて結果を返す
            if (result.output && result.output.mcpClientInstructions) {
              this.logger.info('Schema guidance detected, returning early', {
                methodType,
                phase,
                hasRetryInstructions: !!result.output.retryInstructions,
                hasRecommendedSchema: !!result.output.recommendedInputSchema
              });
              
              return this.createSchemaGuidanceResult(phase, strategy, result, methodType, results);
            }
            
            // スキーマガイダンスがない場合でも、最初のエージェントで失敗した場合は早期リターン
            if (i === 0) {
              this.logger.warn('Primary agent failed without schema guidance, stopping sequence', {
                methodType,
                phase,
                strategy
              });
              break;
            }
            
            // 2番目以降のエージェントで失敗した場合、スキーマガイダンスを生成
            if (i > 0) {
              this.logger.warn('Secondary agent failed, generating schema guidance', {
                methodType,
                phase,
                step: i + 1,
                totalSteps: strategy.sequence.length,
                previousResults: results.length
              });
              
              return this.createSchemaGuidanceResult(phase, strategy, result, methodType, results);
            }
          }
        }
      } else {
        // 並列実行（主要思考法のみ）
        const primaryAgent = this.agents.get(strategy.primary);
        if (primaryAgent) {
          // 入力形式を変換
          const convertedInput = this.convertInputForMethod(strategy.primary, initialInput, phase);
          
          const result = await primaryAgent.think(convertedInput, {
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
      this.logger.error('Orchestration failed', {
        phase,
        strategy,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
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
    const goldenPattern = GOLDEN_PATTERN_SEQUENCE;

    for (let i = 0; i < goldenPattern.length; i++) {
      const methodType = goldenPattern[i];
      const agent = this.agents.get(methodType);
      if (!agent) continue;

      try {
        // 入力形式を変換
        const convertedInput = this.convertInputForMethod(methodType, currentInput, 'business_exploration');
        
        const result = await agent.think(convertedInput, {
          ...context,
          previousResults: results,
          metadata: { ...context.metadata, goldenPattern: true },
        });
        
        results.push(result);
        
        // 失敗した場合の処理
        if (result.status === 'failed') {
          this.logger.warn('Golden pattern step failed', {
            methodType,
            reasoning: result.reasoning,
            step: i + 1,
            totalSteps: goldenPattern.length
          });
          
          // スキーマガイダンスが含まれている場合は、それを含めて結果を返す
          if (result.output && result.output.mcpClientInstructions) {
            this.logger.info('Schema guidance detected in golden pattern, returning early', {
              methodType,
              step: i + 1,
              hasRetryInstructions: !!result.output.retryInstructions,
              hasRecommendedSchema: !!result.output.recommendedInputSchema
            });
            
            return this.createSchemaGuidanceResult('business_exploration', {
              primary: 'abduction',
              secondary: GOLDEN_PATTERN_SEQUENCE.slice(1),
              sequence: GOLDEN_PATTERN_SEQUENCE
            }, result, methodType, results);
          }
          
          // スキーマガイダンスがない場合でも、最初のステップで失敗した場合は早期リターン
          if (i === 0) {
            this.logger.warn('Golden pattern first step failed without schema guidance, stopping sequence', {
              methodType,
              step: i + 1,
              totalSteps: goldenPattern.length
            });
            break;
          }
          
          // 2番目以降のステップで失敗した場合、スキーマガイダンスを生成
          if (i > 0) {
            this.logger.warn('Golden pattern secondary step failed, generating schema guidance', {
              methodType,
              step: i + 1,
              totalSteps: goldenPattern.length,
              previousResults: results.length
            });
            
            return this.createSchemaGuidanceResult('business_exploration', {
              primary: 'abduction',
              secondary: GOLDEN_PATTERN_SEQUENCE.slice(1),
              sequence: GOLDEN_PATTERN_SEQUENCE
            }, result, methodType, results);
          }
          
          // 3番目以降のステップで失敗した場合はスキップして次へ
          continue;
        }
        
        // 成功した結果を次の入力として使用
        if (result.output) {
          currentInput = { ...currentInput, [methodType]: result.output };
        }
        
      } catch (error) {
        this.logger.error('Golden pattern step error', {
          methodType,
          step: i + 1,
          totalSteps: goldenPattern.length,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }

    return this.synthesizeResults('business_exploration', {
      primary: 'abduction',
      secondary: GOLDEN_PATTERN_SEQUENCE.slice(1),
      sequence: GOLDEN_PATTERN_SEQUENCE,
    }, results, initialInput);
  }


  /**
   * 順次実行シーケンス
   */
  private async executeSequentialSequence(
    sequence: ThinkingMethodType[],
    input: Record<string, unknown>,
    context: AgentContext
  ): Promise<IntegratedThinkingResult> {
    const results: ThinkingResult[] = [];
    let currentInput = input;

    for (let i = 0; i < sequence.length; i++) {
      const methodType = sequence[i];
      const agent = this.agents.get(methodType);
      if (!agent) continue;

      try {
        // 入力形式を変換
        const convertedInput = this.convertInputForMethod(methodType, currentInput, 'business_exploration');
        
        const result = await agent.think(convertedInput, {
          ...context,
          previousResults: results,
          metadata: { ...context.metadata, customSequence: true, step: i + 1, totalSteps: sequence.length },
        });
        
        results.push(result);
        
        // 失敗した場合の処理
        if (result.status === 'failed') {
          this.logger.warn('Custom sequence step failed', {
            methodType,
            reasoning: result.reasoning,
            step: i + 1,
            totalSteps: sequence.length
          });
          
          // スキーマガイダンスが含まれている場合は、それを含めて結果を返す
          if (result.output && result.output.mcpClientInstructions) {
            this.logger.info('Schema guidance detected in custom sequence, returning early', {
              methodType,
              step: i + 1,
              hasRetryInstructions: !!result.output.retryInstructions,
              hasRecommendedSchema: !!result.output.recommendedInputSchema
            });
            
            return this.createSchemaGuidanceResult('business_exploration', {
              primary: sequence[0],
              secondary: sequence.slice(1),
              sequence: sequence
            }, result, methodType, results);
          }
          
          // スキーマガイダンスがない場合でも、最初のステップで失敗した場合は早期リターン
          if (i === 0) {
            this.logger.warn('Custom sequence first step failed without schema guidance, stopping sequence', {
              methodType,
              step: i + 1,
              totalSteps: sequence.length
            });
            break;
          }
          
          // 2番目以降のステップで失敗した場合、スキーマガイダンスを生成
          if (i > 0) {
            this.logger.warn('Custom sequence secondary step failed, generating schema guidance', {
              methodType,
              step: i + 1,
              totalSteps: sequence.length,
              previousResults: results.length
            });
            
            return this.createSchemaGuidanceResult('business_exploration', {
              primary: sequence[0],
              secondary: sequence.slice(1),
              sequence: sequence
            }, result, methodType, results);
          }
          
          // 3番目以降のステップで失敗した場合はスキップして次へ
          continue;
        }
        
        // 成功した結果を次の入力として使用
        if (result.output) {
          currentInput = { ...currentInput, [methodType]: result.output };
        }
        
      } catch (error) {
        this.logger.error('Custom sequence step error', {
          methodType,
          step: i + 1,
          totalSteps: sequence.length,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }

    return this.synthesizeResults('business_exploration', {
      primary: sequence[0],
      secondary: sequence.slice(1),
      sequence: sequence
    }, results, input);
  }


  /**
   * カスタム戦略の実行（PHASE_THINKING_MAP形式）
   */
  async processCustomStrategy(
    strategy: { primary: ThinkingMethodType; secondary: ThinkingMethodType[]; sequence: ThinkingMethodType[] },
    input: Record<string, unknown>,
    context: AgentContext
  ): Promise<IntegratedThinkingResult> {
    // 常に順次実行
    const result = await this.executeSequentialSequence(strategy.sequence, input, context);
    // 戦略情報を正しく設定
    return {
      ...result,
      primaryMethod: strategy.primary,
      secondaryMethods: strategy.secondary,
    };
  }

  /**
   * 局面に基づくカスタムシーケンスの実行（PHASE_THINKING_MAPとの互換性）
   */
  async processPhaseCustomSequence(
    phase: DevelopmentPhase,
    input: Record<string, unknown>,
    context: AgentContext
  ): Promise<IntegratedThinkingResult> {
    const strategy = PHASE_THINKING_MAP[phase];
    if (!strategy.sequence) {
      throw new Error(`No sequence defined for phase: ${phase}`);
    }
    
    return this.executeSequentialSequence(strategy.sequence, input, context);
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
    _originalInput: Record<string, unknown>
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
          case 'critical': {
            const criticalOutput = result.output as CriticalOutput;
            if (criticalOutput.recommendations) {
              actionItems.push(...criticalOutput.recommendations);
            }
            break;
          }
          case 'abduction': {
            const abductionOutput = result.output as AbductionOutput;
            if (abductionOutput.hypotheses) {
              const topHypothesis = abductionOutput.hypotheses[0];
              if (topHypothesis?.testablePredicitions) {
                actionItems.push(...topHypothesis.testablePredicitions.map((p: string) => `検証: ${p}`));
              }
            }
            break;
          }
          case 'meta': {
            const metaOutput = result.output as MetaOutput;
            if (metaOutput.recommendations) {
              actionItems.push(...metaOutput.recommendations.map((r: { aspect: string; improvement: string }) => `${r.aspect}: ${r.improvement}`));
            }
            break;
          }
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
   * 思考法に応じた入力形式変換
   * 各思考法のスキーマ要件に適合するように入力データを変換する
   */
  private convertInputForMethod(
    methodType: ThinkingMethodType,
    input: Record<string, unknown>,
    phase: DevelopmentPhase
  ): Record<string, unknown> {
    // 入力データから有用な情報を抽出
    const { 
      problem, 
      context, 
      surprisingFact,
      majorPremise,
      minorPremise,
      question,
      claim,
      proposition,
      observations,
      purpose,
      items,
      currentThinking,
      objective,
      evidence,
      constraints,
      proposedCriteria,
      ...otherInputs 
    } = input;
    
    switch (methodType) {
      case 'abduction':
        return {
          surprisingFact: surprisingFact || problem || '驚くべき事実',
          context: context as string || '',
          domain: phase,
          ...otherInputs,
        };
      
      case 'deductive':
        return {
          majorPremise: majorPremise || problem || '大前提',
          minorPremise: minorPremise || context as string || '小前提',
          domain: phase,
          ...otherInputs,
        };
      
      case 'logical':
        return {
          question: question || problem || '論点を設定してください',
          information: evidence || (context ? [context as string] : []),
          constraints: constraints || [],
          ...otherInputs,
        };
      
      case 'critical':
        return {
          claim: claim || problem || '検証すべき主張',
          evidence: evidence || (context ? [context as string] : []),
          context: context as string || '',
          ...otherInputs,
        };
      
      case 'mece':
        return {
          purpose: purpose || problem || '分類の目的',
          items: items || (context ? [context as string] : []),
          proposedCriteria: proposedCriteria || '',
          ...otherInputs,
        };
      
      case 'inductive':
        return {
          observations: observations || (context ? [context as string] : []),
          context: problem as string || '',
          ...otherInputs,
        };
      
      case 'pac':
        return {
          claim: claim || problem || '検証すべき主張',
          context: context as string || '',
          ...otherInputs,
        };
      
      case 'meta':
        return {
          currentThinking: currentThinking || problem as string || '現在の思考内容',
          objective: objective || context as string || '目的・目標',
          ...otherInputs,
        };
      
      case 'debate':
        return {
          proposition: proposition || problem || '論題（〇〇すべき形式）',
          context: context as string || '',
          ...otherInputs,
        };
      
      default:
        return input;
    }
  }

  /**
   * スキーマガイダンス結果の作成
   */
  private createSchemaGuidanceResult(
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
      ]
    };
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
