import { BaseThinkingAgent, LLMPromptTemplate, type AgentContext, type AgentCapability } from '../core/agent-base.js';
import { 
  ThinkingMethodType, 
  MetaInput, 
  MetaOutput,
  DevelopmentPhase, 
  ThinkingResult
} from '../schemas/thinking.js';

export class MetaThinkingAgent extends BaseThinkingAgent {
  readonly capability: AgentCapability = {
    methodType: 'meta' as ThinkingMethodType,
    description: '思考プロセス自体を対象化し、より高次の視点から評価・改善する',
    applicablePhases: [
      'retrospective',
      'estimation_planning',
      'decision_making'
    ] as DevelopmentPhase[],
    requiredInputSchema: MetaInput,
    outputSchema: MetaOutput,
    combinationSynergies: ['logical', 'critical'] as ThinkingMethodType[],
  };

  protected async executeLLMThinking(input: unknown, context: AgentContext): Promise<Record<string, unknown>> {
    const promptTemplate = new MetaPromptTemplate(this);
    const { system, user } = promptTemplate.generatePrompts(input);

    // AI SDKのgenerateObjectを使用してスキーマ保証
    const result = await this.callLLMWithStructuredOutput(
      MetaOutput,
      system,
      user,
      context,
      {
        temperature: 0.4,
        maxRetries: 3,
        enableAutoRecovery: true,
        schemaName: 'MetaOutput',
        schemaDescription: 'メタ思考の分析結果を表す構造化データ',
        mode: 'json',
      }
    );

    return result as Record<string, unknown>;
  }

  /**
   * メタ思考特有の入力正規化
   */
  protected override performSchemaSpecificNormalization(input: Record<string, unknown>): Record<string, unknown> {
    const normalized = { ...input };

    // 必須フィールドの正規化
    if (!normalized.currentThinking) {
      // currentThinkingが不足している場合、contentやtextから生成
      const content = normalized.content || normalized.text || normalized.message || '';
      normalized.currentThinking = content;
    }

    if (!normalized.objective) {
      // objectiveが不足している場合、デフォルト値を設定
      normalized.objective = '思考プロセスの改善';
    }

    return normalized;
  }

  protected override calculateConfidence(output: Record<string, unknown>, _context: AgentContext): number {
    const metaOutput = output as MetaOutput;
    
    const processEffectiveness = metaOutput.processEvaluation.effectiveness;
    const recommendationScore = Math.min(metaOutput.recommendations.length * 0.1, 0.3);
    const alternativeScore = Math.min(metaOutput.alternativeApproaches.length * 0.05, 0.2);
    
    return Math.min(processEffectiveness * 0.5 + recommendationScore + alternativeScore, 1.0);
  }

  /**
   * メタ思考の推論説明生成
   */
  protected override generateReasoningExplanation(
    input: unknown, 
    output: Record<string, unknown>, 
    _context: AgentContext
  ): string {
    const typedInput = input as { currentThinking: string; objective: string };
    const typedOutput = output as MetaOutput;
    
    const effectivenessPercent = (typedOutput.processEvaluation.effectiveness * 100).toFixed(1);
    
    return `「${typedInput.objective}」を目的として、現在の思考プロセス「${typedInput.currentThinking}」をメタレベルで分析しました。プロセス有効性: ${effectivenessPercent}%、改善提案${typedOutput.recommendations.length}個、代替アプローチ${typedOutput.alternativeApproaches.length}個を生成。思考プロセス自体を対象化し、より高次の視点から評価・改善を行いました。`;
  }

  /**
   * メタ思考後の次ステップ推奨
   */
  override getNextRecommendations(result: ThinkingResult, phase: DevelopmentPhase): ThinkingMethodType[] {
    const baseRecommendations = super.getNextRecommendations(result, phase);
    
    // メタ思考後は具体的な実装が重要
    const metaSpecific: ThinkingMethodType[] = ['logical'];
    
    // 改善提案の実装にはクリティカル思考も有効
    if (phase === 'retrospective' || phase === 'estimation_planning') {
      metaSpecific.push('critical');
    }
    
    // 意思決定段階ではディベート思考も有効
    if (phase === 'decision_making') {
      metaSpecific.push('debate');
    }

    return [...new Set([...metaSpecific, ...baseRecommendations])];
  }
}

class MetaPromptTemplate extends LLMPromptTemplate {
  constructor(private agent: MetaThinkingAgent) {
    super();
  }

  protected getSystemPrompt(): string {
    const schemaExample = this.agent.generateSchemaExample(MetaOutput);
    
    return `あなたはメタ思考の専門家です。

メタ思考の階層:
- 対象レベル: 具体的な行動・計画・目標設定・事実
- メタレベル: 上位概念・評価基準・思考プロセス・意味

分析観点:
1. 現在のプロセスの妥当性評価
2. より効果的なアプローチの提案
3. 思考の思考による質的向上
4. 評価基準・成功指標の再定義

出力形式（JSON）:
${schemaExample}

必ず上記のJSON形式で出力してください。`;
  }

  protected getUserPrompt(input: unknown): string {
    const { currentThinking, objective } = input as { currentThinking: string; objective: string };

    return `以下の思考内容をメタレベルで分析してください。

## 現在の思考内容
${currentThinking}

## 目的・目標
${objective}

## 求めるメタ分析
1. **プロセス評価**: 現在の思考プロセスの有効性
2. **改善提案**: より良いアプローチの提示
3. **代替手法**: 異なる観点からのアプローチ

思考そのものを対象化し、一段高い視点から建設的な改善策を提示してください。`;
  }
}
