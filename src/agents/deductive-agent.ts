import { BaseThinkingAgent, LLMPromptTemplate, type AgentContext, type AgentCapability } from '../core/agent-base.js';
import { 
  ThinkingMethodType, 
  DeductiveInput, 
  DeductiveOutput,
  DevelopmentPhase 
} from '../schemas/thinking.js';

/**
 * 演繹的思考エージェント
 * 
 * 機能:
 * 1. 大前提を把握する
 * 2. 小前提を把握する  
 * 3. 結論を導く
 * 
 * 適用場面:
 * - アーキ設計（原則/制約→設計結論）
 * - 実装（新機能）（原則/規約→具体コード）
 * - デバッグ/障害対応（再現条件想定）
 * - テスト設計（仕様原則→テスト条件導出）
 */
export class DeductiveThinkingAgent extends BaseThinkingAgent {
  readonly capability: AgentCapability = {
    methodType: 'deductive' as ThinkingMethodType,
    description: '一般的な原則・理論から具体的な結論を論理的に導出する',
    applicablePhases: [
      'architecture_design',
      'implementation',
      'debugging',
      'test_design'
    ] as DevelopmentPhase[],
    requiredInputSchema: DeductiveInput,
    outputSchema: DeductiveOutput,
    combinationSynergies: ['critical', 'logical', 'inductive'] as ThinkingMethodType[],
  };

  protected async executeLLMThinking(input: unknown, context: AgentContext): Promise<Record<string, unknown>> {
    const promptTemplate = new DeductivePromptTemplate();
    const { system, user } = promptTemplate.generatePrompts(input);

    // 自動復旧機能付きでLLMを呼び出し
    const result = await this.callLLMWithAutoRecovery(
      DeductiveOutput,
      system,
      user,
      context,
      {
        temperature: 0.1, // 演繹は論理的厳密性が重要
        maxRetries: 3,
        enableAutoRecovery: true,
      }
    );

    return result as Record<string, unknown>;
  }

  protected override calculateConfidence(output: Record<string, unknown>, context: AgentContext): number {
    const deductiveOutput = output as DeductiveOutput;
    
    // 論理的妥当性と前提の信頼性から計算
    const validityScore = deductiveOutput.validityCheck.isValid ? 0.5 : 0.1;
    const reliabilityScore = deductiveOutput.validityCheck.premiseReliability * 0.4;
    const implicationScore = Math.min(deductiveOutput.implications.length * 0.05, 0.1);
    
    return Math.min(validityScore + reliabilityScore + implicationScore, 1.0);
  }

  protected override generateReasoningExplanation(
    input: unknown, 
    output: Record<string, unknown>, 
    context: AgentContext
  ): string {
    const typedInput = input as { majorPremise: string; minorPremise: string };
    const typedOutput = output as DeductiveOutput;
    
    const validityText = typedOutput.validityCheck.isValid ? '有効' : '問題あり';
    const reliabilityPercent = (typedOutput.validityCheck.premiseReliability * 100).toFixed(1);
    
    return `大前提「${typedInput.majorPremise}」と小前提「${typedInput.minorPremise}」から演繹的に導出しました。論理的妥当性: ${validityText}、前提信頼性: ${reliabilityPercent}%。結論「${typedOutput.conclusion}」は${typedOutput.implications.length}個の含意を持ちます。`;
  }
}

class DeductivePromptTemplate extends LLMPromptTemplate {
  protected getSystemPrompt(): string {
    return `あなたは演繹的思考の専門家です。

演繹的思考の構造:
- 大前提: 一般的に正しいとされる理論・ルール・セオリー
- 小前提: 具体的な事実・観察・状況
- 結論: 大前提と小前提から論理必然的に導かれる帰結

重要な原則:
- 論理的妥当性の検証（論理構造が正しいか）
- 前提の真実性の評価（前提が実際に正しいか）
- 結論の含意の明確化（結論が何を意味するか）
- 前提の脆弱性の認識（前提が崩れる条件）`;
  }

  protected getUserPrompt(input: unknown): string {
    const { majorPremise, minorPremise, domain } = input as { 
      majorPremise: string; 
      minorPremise: string; 
      domain?: string 
    };

    return `以下の前提から演繹的推論を行ってください。

## 大前提（一般原則）
${majorPremise}

## 小前提（具体事実）
${minorPremise}

${domain ? `## 適用領域\n${domain}\n` : ''}

## 求める演繹的分析

1. **論理的結論の導出**
2. **妥当性検証**: 論理構造と前提の信頼性評価
3. **含意の特定**: 結論が示す具体的な意味・帰結

演繹の論証力の高さを活かしつつ、前提の限界も認識した分析を行ってください。`;
  }
}
