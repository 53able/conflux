import { generateObject } from 'ai';
import { BaseThinkingAgent, LLMPromptTemplate, type AgentContext, type AgentCapability } from '../core/agent-base.js';
import { 
  ThinkingMethodType, 
  DebateInput, 
  DebateOutput,
  DevelopmentPhase 
} from '../schemas/thinking.js';

export class DebateThinkingAgent extends BaseThinkingAgent {
  readonly capability: AgentCapability = {
    methodType: 'debate' as ThinkingMethodType,
    description: '論題に対する賛成・反対の論点を体系的に検討し意思決定を支援する',
    applicablePhases: [
      'decision_making',
      'architecture_design'
    ] as DevelopmentPhase[],
    requiredInputSchema: DebateInput,
    outputSchema: DebateOutput,
    combinationSynergies: ['critical', 'meta', 'logical'] as ThinkingMethodType[],
  };

  protected async executeLLMThinking(input: unknown, context: AgentContext): Promise<Record<string, unknown>> {
    const promptTemplate = new DebatePromptTemplate();
    const { system, user } = promptTemplate.generatePrompts(input);

    // 自動復旧機能付きでLLMを呼び出し
    const result = await this.callLLMWithAutoRecovery(
      DebateOutput,
      system,
      user,
      context,
      {
        temperature: 0.5, // 多角的な論点発見のため
        maxRetries: 3,
        enableAutoRecovery: true,
      }
    );

    return result as Record<string, unknown>;
  }

  protected override calculateConfidence(output: Record<string, unknown>, context: AgentContext): number {
    const debateOutput = output as DebateOutput;
    
    // 賛成・反対論点のバランス
    const proCount = debateOutput.proArguments.length;
    const conCount = debateOutput.conArguments.length;
    const balanceScore = Math.min(proCount, conCount) * 0.1;
    
    // 論点の平均強度
    const avgProStrength = debateOutput.proArguments.reduce((sum, arg) => sum + arg.strength, 0) / proCount || 0;
    const avgConStrength = debateOutput.conArguments.reduce((sum, arg) => sum + arg.strength, 0) / conCount || 0;
    const strengthScore = (avgProStrength + avgConStrength) / 2;
    
    // 争点の特定
    const disputeScore = Math.min(debateOutput.keyDisputes.length * 0.05, 0.15);
    
    return Math.min(balanceScore + strengthScore * 0.5 + disputeScore, 1.0);
  }

  protected override generateReasoningExplanation(
    input: unknown, 
    output: Record<string, unknown>, 
    context: AgentContext
  ): string {
    const typedInput = input as { proposition: string };
    const typedOutput = output as DebateOutput;
    
    return `「${typedInput.proposition}」についてディベート思考を実施。賛成論点${typedOutput.proArguments.length}個、反対論点${typedOutput.conArguments.length}個を検討し、${typedOutput.keyDisputes.length}個の主要争点を特定しました。最終判断: ${typedOutput.recommendation.decision}（${typedOutput.recommendation.reasoning}）`;
  }
}

class DebatePromptTemplate extends LLMPromptTemplate {
  protected getSystemPrompt(): string {
    return `あなたはディベート思考の専門家です。

ディベート思考の手順:
1. 論題設定（「〇〇すべき」形式）
2. 賛成論点の体系的列挙
3. 反対論点の体系的列挙  
4. 争点の明確化
5. 中立的立場での最終判断

重要な原則:
- 両論併記での公平な検討
- 根拠の強度と妥当性の評価
- 見えていなかった争点の発見
- 感情的にならず論理的に`;
  }

  protected getUserPrompt(input: unknown): string {
    const { proposition, context } = input as { proposition: string; context?: string };

    return `以下の論題についてディベート思考で分析してください。

## 論題
${proposition}

${context ? `## 背景情報\n${context}\n` : ''}

## 求めるディベート分析
1. **賛成論点**: 根拠・強度付きで列挙
2. **反対論点**: 根拠・強度付きで列挙
3. **主要争点**: 議論の核心となる論点
4. **最終判断**: 支持/反対/修正案の決定と理由

勝ち負けではなく、最良の意思決定のための建設的な論点整理を行ってください。`;
  }
}
