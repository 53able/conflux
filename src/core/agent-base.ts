import { z } from 'zod';
import { generateObject } from 'ai';
import { 
  ThinkingMethodType, 
  ThinkingResult, 
  ThinkingProcessStatus,
  DevelopmentPhase 
} from '../schemas/thinking.js';
import type { LLMProvider, LanguageModel } from './llm-provider.js';
import { LLMIntegration } from './llm-provider.js';
import { Logger } from './logger.js';

/**
 * エージェント実行コンテキスト
 */
export interface AgentContext {
  llmProvider: LLMProvider; // AI provider from Vercel AI
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
  think(_input: unknown, context: AgentContext): Promise<ThinkingResult>;
  
  /**
   * 入力データを検証する
   */
  validateInput(_input: unknown): boolean;
  
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
  protected logger = Logger.getInstance();

  constructor(protected config?: Record<string, unknown>) {
    // capabilityは抽象プロパティなので、サブクラスで初期化後にログを出力
    this.logger.debug('BaseThinkingAgent initialized', {
      config: this.config
    });
  }

  /**
   * メイン思考プロセス実行
   * Template Method パターンで標準フローを定義
   */
  async think(_input: unknown, _context: AgentContext): Promise<ThinkingResult> {
    const startTime = Date.now();
    
    try {
      // 0. 早期リターンチェック
      if (this.shouldEarlyReturn(_input)) {
        this.logger.warn('Input is empty or meaningless, skipping processing', {
          methodType: this.capability.methodType,
          input: _input
        });
        
        return this.createEarlyReturnResult(_input, 'Input is empty or meaningless');
      }

      // 1. 入力検証とフォールバック処理
      let processedInput = _input;
      let inputWasNormalized = false;

      if (!this.validateInput(_input)) {
        this.logger.warn('Input validation failed, attempting normalization', {
          methodType: this.capability.methodType,
          input: _input
        });

        // フォールバック処理：入力データを正規化
        processedInput = this.normalizeInput(_input);
        inputWasNormalized = true;

        // 正規化後も検証に失敗し、かつ早期リターンすべき場合は処理をスキップ
        if (!this.validateInput(processedInput) && this.shouldEarlyReturn(processedInput)) {
          this.logger.warn('Normalized input is still meaningless, skipping processing', {
            methodType: this.capability.methodType,
            originalInput: _input,
            normalizedInput: processedInput
          });
          
          return this.createEarlyReturnResult(_input, 'Normalized input is still meaningless');
        }

        // 正規化後も検証に失敗する場合は、推奨スキーマと再リクエスト指示を返す
        if (!this.validateInput(processedInput)) {
          this.logger.warn('Input normalization failed, returning schema guidance', {
            methodType: this.capability.methodType,
            originalInput: _input,
            normalizedInput: processedInput
          });
          
          return this.createSchemaGuidanceResult(_input, processedInput, 'Input normalization failed');
        }
      }

      // 2. 前処理
      const preprocessedInput = await this.preprocess(processedInput, _context);

      // 3. LLMによる思考実行
      const output = await this.executeLLMThinking(preprocessedInput, _context);

      // 4. 後処理と検証
      const validatedOutput = await this.postprocess(output, _context);

      // 5. 次の推奨思考法を決定
      const recommendations = this.getNextRecommendations(
        { 
          method: this.capability.methodType, 
          status: 'completed' as ThinkingProcessStatus,
          input: processedInput as Record<string, unknown>,
          output: validatedOutput,
          confidence: 0.8,
          reasoning: ''
        }, 
        _context.metadata?.phase as DevelopmentPhase || 'requirement_definition'
      );

      // 6. 結果オブジェクト構築
      const result = {
        method: this.capability.methodType,
        status: 'completed' as ThinkingProcessStatus,
        input: processedInput as Record<string, unknown>,
        output: validatedOutput,
        confidence: this.calculateConfidence(validatedOutput, _context),
        reasoning: this.generateReasoningExplanation(processedInput, validatedOutput, _context),
        nextRecommendations: recommendations,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
          inputWasNormalized,
          ..._context.metadata,
        },
      };

      // 入力が正規化された場合は、その旨をログに記録
      if (inputWasNormalized) {
        this.logger.info('Input was successfully normalized and processed', {
          methodType: this.capability.methodType,
          originalInput: _input,
          normalizedInput: processedInput
        });
      }

      return result;

    } catch (error) {
      this.logger.error('Agent execution error', {
        methodType: this.capability.methodType,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        input: _input
      });
      return this.createFailureResult(_input, error instanceof Error ? error.message : 'Unknown error');
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
   * 入力データが早期リターンすべきかチェック
   */
  protected shouldEarlyReturn(input: unknown): boolean {
    // null, undefined, 空文字列
    if (input === null || input === undefined || input === '') {
      return true;
    }

    // 空のオブジェクト
    if (typeof input === 'object' && input !== null) {
      const inputObj = input as Record<string, unknown>;
      const keys = Object.keys(inputObj);
      if (keys.length === 0) {
        return true;
      }
      
      // すべての値が空文字列、null、undefinedの場合
      const allValuesEmpty = keys.every(key => {
        const value = inputObj[key];
        return value === null || value === undefined || value === '' || 
               (Array.isArray(value) && value.length === 0);
      });
      
      if (allValuesEmpty) {
        return true;
      }
    }

    // 文字列の場合、空白文字のみかチェック
    if (typeof input === 'string' && input.trim() === '') {
      return true;
    }

    // オブジェクトの場合、すべての値が空白文字のみかチェック
    if (typeof input === 'object' && input !== null) {
      const inputObj = input as Record<string, unknown>;
      const allValuesWhitespace = Object.values(inputObj).every(value => {
        if (typeof value === 'string') {
          return value.trim() === '';
        }
        if (Array.isArray(value)) {
          return value.length === 0 || value.every(item => typeof item === 'string' && item.trim() === '');
        }
        return value === null || value === undefined || value === '';
      });
      
      if (allValuesWhitespace) {
        return true;
      }
    }

    return false;
  }

  /**
   * 入力データの正規化（フォールバック処理）
   * スキーマ検証に失敗した場合に、可能な限りデータを正規化して再試行
   */
  protected normalizeInput(input: unknown): unknown {
    if (!input || typeof input !== 'object') {
      return this.createFallbackInput(input);
    }

    const inputObj = input as Record<string, unknown>;
    const normalizedInput = { ...inputObj };

    // 各エージェントのスキーマに応じた正規化
    return this.performSchemaSpecificNormalization(normalizedInput);
  }

  /**
   * スキーマ固有の正規化処理（サブクラスでオーバーライド）
   */
  protected performSchemaSpecificNormalization(input: Record<string, unknown>): Record<string, unknown> {
    return input;
  }

  /**
   * フォールバック用の入力データ作成
   */
  protected createFallbackInput(input: unknown): Record<string, unknown> {
    // 基本的なフォールバック入力を作成
    if (typeof input === 'string') {
      return { content: input };
    }
    
    if (input && typeof input === 'object') {
      const inputObj = input as Record<string, unknown>;
      // 既存のフィールドを保持しつつ、不足分を補完
      return {
        content: inputObj.content || inputObj.text || inputObj.message || '',
        context: inputObj.context || '',
        ...inputObj
      };
    }

    return { content: String(input) };
  }

  /**
   * 早期リターン用の結果作成
   */
  protected createEarlyReturnResult(input: unknown, reason: string): ThinkingResult {
    // 推奨データ構造を生成
    const recommendedSchema = this.generateSchemaExample(this.capability.requiredInputSchema);
    
    return {
      method: this.capability.methodType,
      status: 'failed' as ThinkingProcessStatus,
      input: input as Record<string, unknown>,
      output: {
        error: reason,
        message: 'Processing skipped due to empty or meaningless input',
        recommendedInputSchema: recommendedSchema,
        retryInstructions: `入力例を確認してからエラーの原因を特定し、正しい形式で再実行してください。\n\n推奨データ構造:\n${recommendedSchema}`,
        mcpClientInstructions: {
          action: 'retry_with_correct_schema',
          message: '入力データが不正です。推奨スキーマに従って再リクエストしてください。',
          mcpToolName: this.getMCPToolName(),
          recommendedSchema: JSON.parse(recommendedSchema),
          examples: this.generateInputExamples()
        }
      },
      confidence: 0.0,
      reasoning: `入力データが空または意味がないため、${this.capability.methodType}思考をスキップしました。理由: ${reason}`,
      nextRecommendations: [],
      metadata: {
        executionTime: 0,
        timestamp: new Date().toISOString(),
        earlyReturn: true,
        reason,
        schemaValidationFailed: true
      },
    };
  }

  /**
   * 入力例を生成するメソッド
   */
  protected generateInputExamples(): Record<string, unknown>[] {
    try {
      const schema = this.capability.requiredInputSchema;
      const jsonSchema = z.toJSONSchema(schema);
      const example = this.createExampleFromJSONSchema(jsonSchema);
      return [example as Record<string, unknown>];
    } catch (error) {
      this.logger.warn('Failed to generate input examples', {
        methodType: this.capability.methodType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [{}];
    }
  }

  /**
   * スキーマガイダンス用の結果作成（正規化失敗時）
   */
  protected createSchemaGuidanceResult(
    originalInput: unknown, 
    normalizedInput: unknown, 
    reason: string
  ): ThinkingResult {
    // 推奨データ構造を生成
    const recommendedSchema = this.generateSchemaExample(this.capability.requiredInputSchema);
    
    return {
      method: this.capability.methodType,
      status: 'failed' as ThinkingProcessStatus,
      input: originalInput as Record<string, unknown>,
      output: {
        error: reason,
        message: 'Input data could not be normalized to match required schema',
        originalInput: originalInput,
        normalizedInput: normalizedInput,
        recommendedInputSchema: recommendedSchema,
        retryInstructions: `入力データを正規化できませんでした。推奨スキーマに従って正しい形式で再実行してください。\n\n推奨データ構造:\n${recommendedSchema}`,
        mcpClientInstructions: {
          action: 'retry_with_correct_schema',
          message: '入力データの形式が不正です。推奨スキーマに従って再リクエストしてください。',
          mcpToolName: this.getMCPToolName(),
          recommendedSchema: JSON.parse(recommendedSchema),
          examples: this.generateInputExamples(),
          validationErrors: this.getValidationErrors(normalizedInput)
        }
      },
      confidence: 0.0,
      reasoning: `入力データの正規化に失敗したため、${this.capability.methodType}思考を実行できませんでした。理由: ${reason}`,
      nextRecommendations: [],
      metadata: {
        executionTime: 0,
        timestamp: new Date().toISOString(),
        schemaValidationFailed: true,
        normalizationFailed: true,
        reason
      },
    };
  }

  /**
   * バリデーションエラーの詳細を取得
   */
  protected getValidationErrors(input: unknown): string[] {
    try {
      this.capability.requiredInputSchema.parse(input);
      return [];
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`);
      }
      return ['Unknown validation error'];
    }
  }

  /**
   * MCPツール名を取得
   */
  protected getMCPToolName(): string {
    const methodType = this.capability.methodType;
    
    // 単一思考法のMCPツール名
    const singleMethodToolName = `process-single-method`;
    
    // 局面別思考プロセスのMCPツール名
    const phaseToolName = `process-phase`;
    
    // 黄金パターンのMCPツール名
    const goldenPatternToolName = `process-golden-pattern`;
    
    return {
      'abduction': singleMethodToolName,
      'logical': singleMethodToolName,
      'deductive': singleMethodToolName,
      'inductive': singleMethodToolName,
      'mece': singleMethodToolName,
      'pac': singleMethodToolName,
      'meta': singleMethodToolName,
      'debate': singleMethodToolName,
      'critical': singleMethodToolName,
    }[methodType] || singleMethodToolName;
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
  protected async preprocess(_input: unknown, _context: AgentContext): Promise<unknown> {
    return _input;
  }

  /**
   * LLMによる思考実行（サブクラスで必須実装）
   */
  protected abstract executeLLMThinking(_input: unknown, _context: AgentContext): Promise<Record<string, unknown>>;

  /**
   * 後処理フック（サブクラスでオーバーライド可能）
   */
  protected async postprocess(_output: Record<string, unknown>, _context: AgentContext): Promise<Record<string, unknown>> {
    return _output;
  }

  /**
   * 信頼度計算（サブクラスでオーバーライド可能）
   */
  protected calculateConfidence(_output: Record<string, unknown>, _context: AgentContext): number {
    // デフォルトは中程度の信頼度
    return 0.7;
  }

  /**
   * ZodスキーマからJSON例を動的生成
   */
  public generateSchemaExample<T>(schema: z.ZodType<T>): string {
    const jsonSchema = z.toJSONSchema(schema);
    const example = this.createExampleFromJSONSchema(jsonSchema);
    return JSON.stringify(example, null, 2);
  }

  private createExampleFromJSONSchema(jsonSchema: Record<string, unknown>): Record<string, unknown> {
    if (jsonSchema.type === 'object') {
      const example: Record<string, unknown> = {};
      
      const properties = jsonSchema.properties as Record<string, unknown> | undefined;
      if (properties) {
        for (const [key, property] of Object.entries(properties)) {
          example[key] = this.createExampleFromProperty(property);
        }
      }
      
      return example;
    }
    
    return this.createExampleFromProperty(jsonSchema) as Record<string, unknown>;
  }

  private createExampleFromProperty(property: unknown): unknown {
    if (typeof property === 'object' && property !== null) {
      const prop = property as Record<string, unknown>;
      
      if (prop.type === 'array') {
        const itemExample = this.createExampleFromProperty(prop.items);
        return [itemExample];
      } else if (prop.type === 'object') {
        return this.createExampleFromJSONSchema(prop);
      } else if (prop.type === 'string') {
        // 説明がある場合はそれを使用、なければデフォルト
        return prop.description || "例: 文字列";
      } else if (prop.type === 'number') {
        const examples = prop.examples as unknown[] | undefined;
        return examples?.[0] || 0.8;
      } else if (prop.type === 'integer') {
        const examples = prop.examples as unknown[] | undefined;
        return examples?.[0] || 1;
      }
    }
    
    return "例: 値";
  }

  /**
   * AI SDKのgenerateObjectを使用した構造化出力保証メソッド
   */
  protected async callLLMWithStructuredOutput<T>(
    schema: z.ZodSchema<T>,
    systemPrompt: string,
    userPrompt: string,
    context: AgentContext,
    options?: {
      temperature?: number;
      maxRetries?: number;
      enableAutoRecovery?: boolean;
      mode?: 'auto' | 'json' | 'tool';
      schemaName?: string;
      schemaDescription?: string;
    }
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    const enableAutoRecovery = options?.enableAutoRecovery ?? true;
    
    // LLMIntegrationが利用可能な場合は自動復旧機能を使用
    if (context.llmIntegration && enableAutoRecovery) {
      try {
        return await context.llmIntegration.generateStructuredOutput<T>(
          schema,
          systemPrompt,
          userPrompt,
          undefined, // プロバイダー名はLLMIntegrationが自動選択
          options
        );
      } catch (error) {
        this.logger.warn('LLMIntegration failed, falling back to direct AI SDK call', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        // フォールバック処理に続行
      }
    }

    // AI SDKのgenerateObjectを直接使用（スキーマ保証）
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
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

        // AI SDKのgenerateObjectを使用（スキーマ保証）
        const generateObjectOptions: Parameters<typeof generateObject>[0] = {
          model: model as LanguageModel,
          schema,
          system: systemPrompt,
          prompt: userPrompt,
          temperature: options?.temperature ?? 0.3,
          mode: options?.mode ?? 'auto',
        };

        if (options?.schemaName) {
          generateObjectOptions.schemaName = options.schemaName;
        }
        if (options?.schemaDescription) {
          generateObjectOptions.schemaDescription = options.schemaDescription;
        }

        const result = await generateObject(generateObjectOptions);

        return result.object as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        this.logger.warn('Structured output attempt failed', {
          attempt,
          maxRetries,
          error: lastError.message,
          schema: schema.constructor.name
        });
        
        if (attempt < maxRetries) {
          // 指数バックオフでリトライ間隔を調整
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // すべてのリトライが失敗した場合
    const errorMessage = lastError?.message || 'Unknown error';
    this.logger.error('Structured output failed after all retries', {
      error: errorMessage,
      schema: schema.constructor.name,
      systemPrompt: systemPrompt.substring(0, 100) + '...',
      userPrompt: userPrompt.substring(0, 100) + '...',
      attempts: maxRetries
    });
    throw new Error(`Structured output failed after ${maxRetries} attempts: ${errorMessage}`);
  }


  /**
   * 推論説明生成（サブクラスでオーバーライド可能）
   */
  protected generateReasoningExplanation(
    _input: unknown, 
    _output: Record<string, unknown>, 
    _context: AgentContext
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
  protected abstract getUserPrompt(_input: unknown): string;
  
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
