import { BaseThinkingAgent, LLMPromptTemplate, type AgentContext, type AgentCapability } from '../core/agent-base.js';
import { 
  ThinkingMethodType, 
  InductiveInput, 
  InductiveOutput,
  DevelopmentPhase, 
  ThinkingResult
} from '../schemas/thinking.js';

export class InductiveThinkingAgent extends BaseThinkingAgent {
  readonly capability: AgentCapability = {
    methodType: 'inductive' as ThinkingMethodType,
    description: '個別事例から共通パターンを発見し一般論を構築する',
    applicablePhases: [
      'value_hypothesis',
      'experimentation',
      'debugging'
    ] as DevelopmentPhase[],
    requiredInputSchema: InductiveInput,
    outputSchema: InductiveOutput,
    combinationSynergies: ['critical', 'deductive', 'abduction'] as ThinkingMethodType[],
  };

  protected async executeLLMThinking(input: unknown, context: AgentContext): Promise<Record<string, unknown>> {
    const promptTemplate = new InductivePromptTemplate(this);
    const { system, user } = promptTemplate.generatePrompts(input);

    // AI SDKのgenerateObjectを使用してスキーマ保証
    const result = await this.callLLMWithStructuredOutput(
      InductiveOutput,
      system,
      user,
      context,
      {
        temperature: 0.3,
        maxRetries: 3,
        enableAutoRecovery: true,
        schemaName: 'InductiveOutput',
        schemaDescription: '帰納的思考の分析結果を表す構造化データ',
        mode: 'json',
      }
    );

    return result as Record<string, unknown>;
  }

  protected override calculateConfidence(output: Record<string, unknown>, _context: AgentContext): number {
    const inductiveOutput = output as InductiveOutput;
    
    // サンプルサイズと信頼度の平均から算出
    const avgConfidence = inductiveOutput.generalizations.reduce((sum, g) => sum + g.confidence, 0) / inductiveOutput.generalizations.length;
    const sampleSizeBonus = Math.min(inductiveOutput.sampleSize * 0.02, 0.3);
    
    return Math.min(avgConfidence + sampleSizeBonus, 1.0);
  }

  /**
   * 帰納的思考の推論説明生成
   */
  protected override generateReasoningExplanation(
    input: unknown, 
    output: Record<string, unknown>, 
    _context: AgentContext
  ): string {
    const typedInput = input as { observations: string[] };
    const typedOutput = output as InductiveOutput;
    
    const topGeneralization = typedOutput.generalizations.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    
    return `「${typedInput.observations.length}個の観察データ」から帰納的に分析し、${typedOutput.generalizations.length}個の一般化を発見しました。最も信頼度の高い一般化は「${topGeneralization.pattern}」（信頼度: ${(topGeneralization.confidence * 100).toFixed(1)}%）です。サンプルサイズ: ${typedOutput.sampleSize}、バイアス警告: ${typedOutput.biasWarnings?.length || 0}個を特定しています。`;
  }

  /**
   * 帰納的思考後の次ステップ推奨
   */
  override getNextRecommendations(result: ThinkingResult, phase: DevelopmentPhase): ThinkingMethodType[] {
    const baseRecommendations = super.getNextRecommendations(result, phase);
    
    // 帰納思考後は仮説の検証が重要
    const inductiveSpecific: ThinkingMethodType[] = ['deductive', 'critical'];
    
    // 価値仮説の検証にはアブダクションも有効
    if (phase === 'value_hypothesis') {
      inductiveSpecific.push('abduction');
    }
    
    // 実験段階ではメタ思考でプロセス改善
    if (phase === 'experimentation') {
      inductiveSpecific.push('meta');
    }

    return [...new Set([...inductiveSpecific, ...baseRecommendations])];
  }
}

class InductivePromptTemplate extends LLMPromptTemplate {
  constructor(private agent: InductiveThinkingAgent) {
    super();
  }

  protected getSystemPrompt(): string {
    const schemaExample = this.agent.generateSchemaExample(InductiveOutput);
    
    return `あなたは帰納的思考の専門家です。観察データを分析してパターンと一般化を発見してください。

帰納的思考の手順:
1. 観察データから共通パターンを探す
2. パターンに基づいて一般化を構築する
3. 各一般化の信頼度を評価する
4. 例外やバイアスを特定する

重要な原則:
- 個別事例から共通パターンを発見し、一般論を構築する
- サンプルサイズと代表性を考慮する
- バイアスや制限事項を認識する
- 信頼度を0-1の数値で表現する
- 例外となる観察データも明記する

出力形式（JSON）:
${schemaExample}

必ず上記のJSON形式で出力してください。`;
  }

  protected getUserPrompt(input: unknown): string {
    const { observations, context } = input as { observations: string[]; context?: string };

    return `以下の観察データを分析して、パターンと一般化を発見してください。

## 観察データ
${observations.map((obs, i) => `${i + 1}. ${obs}`).join('\n')}

${context ? `## コンテキスト\n${context}\n` : ''}

## 求める分析

1. **一般化の発見**
   - 観察データから共通する特徴や傾向を特定
   - 一般化の強度と一貫性を評価

2. **一般化の構築**
   - 発見したパターンから一般論を導出
   - 各一般化の信頼度を0-1の数値で表現
   - 支持する根拠となる観察データを明示
   - 例外となる観察データも特定

3. **バイアスの認識**
   - サンプルサイズの適切性
   - 潜在的なバイアスや制限
   - 一般化の限界を明記

帰納的思考の本質である「個別から一般へ」の推論を重視し、慎重かつ論理的な分析を行ってください。`;
  }
}
