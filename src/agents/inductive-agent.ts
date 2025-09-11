import { BaseThinkingAgent, LLMPromptTemplate, type AgentContext, type AgentCapability } from '../core/agent-base.js';
import { 
  ThinkingMethodType, 
  InductiveInput, 
  InductiveOutput,
  DevelopmentPhase 
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
    const promptTemplate = new InductivePromptTemplate();
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
      }
    );

    return result as Record<string, unknown>;
  }

  protected override calculateConfidence(output: Record<string, unknown>, _context: AgentContext): number {
    const inductiveOutput = output as InductiveOutput;
    
    // サンプルサイズと信頼度の平均から算出
    const avgConfidence = inductiveOutput.patterns.reduce((sum, p) => sum + p.confidence, 0) / inductiveOutput.patterns.length;
    const sampleSizeBonus = Math.min(inductiveOutput.sampleSize * 0.02, 0.3);
    
    return Math.min(avgConfidence + sampleSizeBonus, 1.0);
  }
}

class InductivePromptTemplate extends LLMPromptTemplate {
  protected getSystemPrompt(): string {
    return `あなたは帰納的思考の専門家です。観察データを分析してパターンと一般化を発見してください。

帰納的思考の手順:
1. 観察データから共通パターンを探す
2. パターンに基づいて一般化を構築する
3. 各一般化の信頼度を評価する
4. 例外や制限事項を特定する

重要な原則:
- 個別事例から共通パターンを発見し、一般論を構築する
- サンプルサイズと代表性を考慮する
- バイアスや制限事項を認識する
- 信頼度を0-1の数値で表現する

出力は必ず指定されたスキーマに従ってください。`;
  }

  protected getUserPrompt(input: unknown): string {
    const { observations, context } = input as { observations: string[]; context?: string };

    return `以下の観察データを分析して、パターンと一般化を発見してください。

## 観察データ
${observations.map((obs, i) => `${i + 1}. ${obs}`).join('\n')}

${context ? `## コンテキスト\n${context}\n` : ''}

## 求める分析

1. **共通パターンの発見**
   - 観察データから共通する特徴や傾向を特定
   - パターンの強度と一貫性を評価

2. **一般化の構築**
   - 発見したパターンから一般論を導出
   - 各一般化の信頼度を0-1の数値で表現
   - 支持する根拠となる観察データを明示

3. **制限事項の認識**
   - サンプルサイズの適切性
   - 潜在的なバイアスや制限
   - 例外となる観察データ

帰納的思考の本質である「個別から一般へ」の推論を重視し、慎重かつ論理的な分析を行ってください。`;
  }
}
