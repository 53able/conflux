import { z } from 'zod';
import { generateText, generateObject } from 'ai';
import { 
  ThinkingMethodType, 
  ThinkingResult, 
  ThinkingProcessStatus,
  DevelopmentPhase 
} from '../schemas/thinking.js';
import { LLMIntegration } from './llm-provider.js';

/**
 * エージェント実行コンテキスト
 */
export interface AgentContext {
  llmProvider: any; // AI provider from Vercel AI
  llmIntegration?: LLMIntegration; // 自動復旧機能付きLLM統合
  userId?: string | undefined;
  sessionId?: string;
  previousResults?: ThinkingResult[];
  metadata?: Record<string, unknown>;
}

/**
 * エージェント能力の定義
 */
export interface AgentCapability {
  methodType: ThinkingMethodType;
  description: string;
  applicablePhases: DevelopmentPhase[];
  requiredInputSchema: z.ZodSchema;
  outputSchema: z.ZodSchema;
  combinationSynergies: ThinkingMethodType[]; // 相性の良い思考法
}

/**
 * 思考法エージェントのベースインターフェース
 */
export interface IThinkingAgent {
  readonly capability: AgentCapability;
  
  /**
   * 思考法を実行する
   */
  think(input: unknown, context: AgentContext): Promise<ThinkingResult>;
  
  /**
   * 入力データを検証する
   */
  validateInput(input: unknown): boolean;
  
  /**
   * 次に推奨される思考法を提案する
   */
  getNextRecommendations(result: ThinkingResult, phase: DevelopmentPhase): ThinkingMethodType[];
}

/**
 * 思考法エージェントのベースクラス
 * Anthropic社のエージェント設計原則を参考:
 * - 明確な責務分離
 * - エラーハンドリング
 * - 状態管理
 * - 組み合わせ可能性
 */
export abstract class BaseThinkingAgent implements IThinkingAgent {
  abstract readonly capability: AgentCapability;

  constructor(protected config?: Record<string, unknown>) {}

  /**
   * メイン思考プロセス実行
   * Template Method パターンで標準フローを定義
   */
  async think(input: unknown, context: AgentContext): Promise<ThinkingResult> {
    const startTime = Date.now();
    
    try {
      // 1. 入力検証
      if (!this.validateInput(input)) {
        return this.createFailureResult(input, 'Invalid input provided');
      }

      // 2. 前処理
      const preprocessedInput = await this.preprocess(input, context);

      // 3. LLMによる思考実行
      const output = await this.executeLLMThinking(preprocessedInput, context);

      // 4. 後処理と検証
      const validatedOutput = await this.postprocess(output, context);

      // 5. 次の推奨思考法を決定
      const recommendations = this.getNextRecommendations(
        { 
          method: this.capability.methodType, 
          status: 'completed' as ThinkingProcessStatus,
          input: preprocessedInput as Record<string, unknown>,
          output: validatedOutput,
          confidence: 0.8,
          reasoning: ''
        }, 
        context.metadata?.phase as DevelopmentPhase || 'requirement_definition'
      );

      // 6. 結果オブジェクト構築
      return {
        method: this.capability.methodType,
        status: 'completed' as ThinkingProcessStatus,
        input: preprocessedInput as Record<string, unknown>,
        output: validatedOutput,
        confidence: this.calculateConfidence(validatedOutput, context),
        reasoning: this.generateReasoningExplanation(input, validatedOutput, context),
        nextRecommendations: recommendations,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          ...context.metadata,
        },
      };

    } catch (error) {
      console.error(`Error in ${this.capability.methodType} agent:`, error);
      return this.createFailureResult(input, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * 入力データ検証
   */
  validateInput(input: unknown): boolean {
    try {
      this.capability.requiredInputSchema.parse(input);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 次の推奨思考法を提案（デフォルト実装）
   */
  getNextRecommendations(result: ThinkingResult, phase: DevelopmentPhase): ThinkingMethodType[] {
    // 基本的な組み合わせルール
    const baseRecommendations = this.capability.combinationSynergies;
    
    // 局面に応じた調整
    const phaseSpecificRecommendations = this.getPhaseSpecificRecommendations(phase);
    
    return [...new Set([...baseRecommendations, ...phaseSpecificRecommendations])];
  }

  /**
   * 前処理フック（サブクラスでオーバーライド可能）
   */
  protected async preprocess(input: unknown, context: AgentContext): Promise<unknown> {
    return input;
  }

  /**
   * LLMによる思考実行（サブクラスで必須実装）
   */
  protected abstract executeLLMThinking(input: unknown, context: AgentContext): Promise<Record<string, unknown>>;

  /**
   * 後処理フック（サブクラスでオーバーライド可能）
   */
  protected async postprocess(output: Record<string, unknown>, context: AgentContext): Promise<Record<string, unknown>> {
    return output;
  }

  /**
   * 信頼度計算（サブクラスでオーバーライド可能）
   */
  protected calculateConfidence(output: Record<string, unknown>, context: AgentContext): number {
    // デフォルトは中程度の信頼度
    return 0.7;
  }

  /**
   * 自動復旧機能付きLLM呼び出しヘルパー
   */
  protected async callLLMWithAutoRecovery<T>(
    schema: z.ZodSchema<T>,
    systemPrompt: string,
    userPrompt: string,
    context: AgentContext,
    options?: {
      temperature?: number;
      maxRetries?: number;
      enableAutoRecovery?: boolean;
    }
  ): Promise<T> {
    // LLMIntegrationが利用可能な場合は自動復旧機能を使用
    if (context.llmIntegration) {
      return await context.llmIntegration.generateStructuredOutput<T>(
        schema,
        systemPrompt,
        userPrompt,
        undefined, // プロバイダー名はLLMIntegrationが自動選択
        options
      );
    }

    // フォールバック：公式AI SDK v5パターンを直接使用
    try {
      const { openai } = await import('@ai-sdk/openai');
      const { anthropic } = await import('@ai-sdk/anthropic');
      const { google } = await import('@ai-sdk/google');
      
      // デフォルトプロバイダー選択（OpenAI優先）
      const defaultProvider = process.env.DEFAULT_LLM_PROVIDER || 'openai';
      
      let model;
      if (defaultProvider === 'anthropic') {
        const modelName = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-latest';
        model = anthropic(modelName);
      } else if (defaultProvider === 'google') {
        const modelName = process.env.GOOGLE_MODEL || 'gemini-2.0-flash-exp';
        model = google(modelName);
      } else {
        const modelName = process.env.OPENAI_MODEL || 'gpt-5';
        model = openai(modelName);
      }

      const result = await generateObject({
        model: model as any, // AI SDK v5の型互換性問題を回避
        schema,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: options?.temperature ?? 0.3,
      });

      return result.object as T;
    } catch (error) {
      throw new Error(`LLM generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 推論説明生成（サブクラスでオーバーライド可能）
   */
  protected generateReasoningExplanation(
    input: unknown, 
    output: Record<string, unknown>, 
    context: AgentContext
  ): string {
    return `Applied ${this.capability.methodType} thinking methodology to analyze the input and generate structured output.`;
  }

  /**
   * 局面固有の推奨思考法取得
   */
  private getPhaseSpecificRecommendations(phase: DevelopmentPhase): ThinkingMethodType[] {
    const phaseRecommendations: Record<DevelopmentPhase, ThinkingMethodType[]> = {
      business_exploration: ['abduction', 'inductive', 'meta'],
      requirement_definition: ['logical', 'mece', 'critical'],
      value_hypothesis: ['inductive', 'critical'],
      architecture_design: ['deductive', 'debate'],
      prioritization: ['mece', 'logical'],
      estimation_planning: ['logical', 'meta'],
      implementation: ['deductive', 'critical'],
      debugging: ['abduction', 'deductive', 'inductive'],
      refactoring: ['critical', 'mece', 'logical'],
      code_review: ['critical', 'deductive', 'mece'],
      test_design: ['deductive', 'mece', 'inductive'],
      experimentation: ['inductive', 'critical'],
      decision_making: ['debate', 'meta'],
      retrospective: ['meta', 'logical', 'pac'],
      hypothesis_breakdown: ['pac', 'critical'],
    };

    return phaseRecommendations[phase] || [];
  }

  /**
   * 失敗結果オブジェクトの作成
   */
  private createFailureResult(input: unknown, error: string): ThinkingResult {
    return {
      method: this.capability.methodType,
      status: 'failed' as ThinkingProcessStatus,
      input: input as Record<string, unknown>,
      confidence: 0,
      reasoning: `Failed to execute ${this.capability.methodType} thinking: ${error}`,
      metadata: {
        error,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * LLM思考プロンプトのベーステンプレート
 */
export abstract class LLMPromptTemplate {
  protected abstract getSystemPrompt(): string;
  protected abstract getUserPrompt(input: unknown): string;
  
  protected getCommonSystemPrompt(): string {
    return `You are a specialized thinking methodology expert. Your role is to apply structured thinking approaches to analyze problems and generate insights.

Key principles:
- Be systematic and thorough in your analysis
- Follow the specific methodology guidelines precisely  
- Provide clear reasoning for your conclusions
- Identify potential biases and limitations
- Suggest next steps and complementary thinking approaches

Always respond in Japanese unless specifically requested otherwise.`;
  }

  public generatePrompts(input: unknown): { system: string; user: string } {
    return {
      system: `${this.getCommonSystemPrompt()}\n\n${this.getSystemPrompt()}`,
      user: this.getUserPrompt(input),
    };
  }
}
