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

    // 自動復旧機能付きでLLMを呼び出し
    const result = await this.callLLMWithAutoRecovery(
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
    const avgConfidence = inductiveOutput.generalizations.reduce((sum, g) => sum + g.confidence, 0) / inductiveOutput.generalizations.length;
    const sampleSizeBonus = Math.min(inductiveOutput.sampleSize * 0.02, 0.3);
    
    return Math.min(avgConfidence + sampleSizeBonus, 1.0);
  }
}

class InductivePromptTemplate extends LLMPromptTemplate {
  protected getSystemPrompt(): string {
    return `あなたは帰納的思考の専門家です。

帰納的思考の手順:
1. 具体的サンプル・事例の収集
2. 共通パターン・規則性の発見
3. 一般論・法則の構築
4. 例外・限界の認識

重要な注意点:
- サンプルサイズと代表性の評価
- 無理な一般化の回避
- バイアス（確証バイアス、選択バイアス等）への警戒
- 反証事例の可能性`;
  }

  protected getUserPrompt(input: unknown): string {
    const { observations, context } = input as { observations: string[]; context?: string };

    return `以下の観測データから帰納的推論を行ってください。

## 観測サンプル
${observations.map((obs, i) => `${i + 1}. ${obs}`).join('\n')}

${context ? `## コンテキスト\n${context}\n` : ''}

## 求める帰納的分析
1. **パターン発見**: 共通点・規則性の特定
2. **一般化**: 他のケースにも適用可能な法則
3. **信頼度評価**: サンプルサイズと代表性の考慮
4. **限界認識**: 例外や適用限界の明示`;
  }
}
