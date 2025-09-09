import { generateObject } from 'ai';
import { BaseThinkingAgent, LLMPromptTemplate, type AgentContext, type AgentCapability } from '../core/agent-base.js';
import { 
  ThinkingMethodType, 
  PACInput, 
  PACOutput,
  DevelopmentPhase 
} from '../schemas/thinking.js';

export class PACThinkingAgent extends BaseThinkingAgent {
  readonly capability: AgentCapability = {
    methodType: 'pac' as ThinkingMethodType,
    description: '仮説を前提・仮定・結論に分解し、仮定と前提の妥当性を検証する',
    applicablePhases: [
      'hypothesis_breakdown',
      'retrospective'
    ] as DevelopmentPhase[],
    requiredInputSchema: PACInput,
    outputSchema: PACOutput,
    combinationSynergies: ['critical', 'logical'] as ThinkingMethodType[],
  };

  protected async executeLLMThinking(input: unknown, context: AgentContext): Promise<Record<string, unknown>> {
    const promptTemplate = new PACPromptTemplate();
    const { system, user } = promptTemplate.generatePrompts(input);

    // 自動復旧機能付きでLLMを呼び出し
    const result = await this.callLLMWithAutoRecovery(
      PACOutput,
      system,
      user,
      context,
      {
        temperature: 0.2,
        maxRetries: 3,
        enableAutoRecovery: true,
      }
    );

    return result as Record<string, unknown>;
  }

  protected override calculateConfidence(output: Record<string, unknown>, context: AgentContext): number {
    const pacOutput = output as PACOutput;
    
    const assumptionValidityScore = pacOutput.assumptions_validity.isValid ? 0.4 : 0.1;
    const premiseReliabilityScore = pacOutput.premise_validity.isReliable ? 0.4 : 0.1;
    const testMethodScore = Math.min(pacOutput.assumptions_validity.testMethods.length * 0.05, 0.2);
    
    return Math.min(assumptionValidityScore + premiseReliabilityScore + testMethodScore, 1.0);
  }
}

class PACPromptTemplate extends LLMPromptTemplate {
  protected getSystemPrompt(): string {
    return `あなたはPAC思考の専門家です。

PAC思考の構造:
- P (Premise): 事実・制約として確認できる前提
- A (Assumption): 前提と結論をつなぐ暗黙の仮定  
- C (Conclusion): 主張・結論

分析の重点:
1. 仮定(A)の妥当性検証 - 時代変化で無効になっていないか
2. 前提(P)の信頼性検証 - 個人の解釈で美化されていないか
3. 検証方法の提示 - 仮定を実験で壊せる形に`;
  }

  protected getUserPrompt(input: unknown): string {
    const { claim, context } = input as { claim: string; context?: string };

    return `以下の主張をPACに分解し、仮定と前提の妥当性を検証してください。

## 主張・結論
${claim}

${context ? `## コンテキスト\n${context}\n` : ''}

## 求めるPAC分析
1. **PAC分解**: 前提・仮定・結論の明確化
2. **仮定の検証**: 現在も有効か、検証方法は何か
3. **前提の検証**: 客観的事実か、バイアスはないか`;
  }
}
