import { BaseThinkingAgent, LLMPromptTemplate, type AgentContext, type AgentCapability } from '../core/agent-base.js';
import { 
  ThinkingMethodType, 
  DebateInput, 
  DebateOutput,
  DevelopmentPhase, 
  ThinkingResult
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
    const promptTemplate = new DebatePromptTemplate(this);
    const { system, user } = promptTemplate.generatePrompts(input);

    // AI SDKのgenerateObjectを使用してスキーマ保証
    const result = await this.callLLMWithStructuredOutput(
      DebateOutput,
      system,
      user,
      context,
      {
        temperature: 0.5, // 多角的な論点発見のため
        maxRetries: 3,
        enableAutoRecovery: true,
        schemaName: 'DebateOutput',
        schemaDescription: 'ディベート思考の分析結果を表す構造化データ',
        mode: 'json',
      }
    );

    return result as Record<string, unknown>;
  }

  /**
   * ディベート思考特有の入力正規化
   */
  protected override performSchemaSpecificNormalization(input: Record<string, unknown>): Record<string, unknown> {
    const normalized = { ...input };

    // 必須フィールドの正規化
    if (!normalized.proposition) {
      // propositionが不足している場合、contentやtextから生成
      const content = normalized.content || normalized.text || normalized.message || '';
      normalized.proposition = content;
    }

    // contextの正規化
    if (!normalized.context) {
      normalized.context = '';
    }

    return normalized;
  }

  protected override calculateConfidence(output: Record<string, unknown>, _context: AgentContext): number {
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
    _context: AgentContext
  ): string {
    const typedInput = input as { proposition: string };
    const typedOutput = output as DebateOutput;
    
    return `「${typedInput.proposition}」についてディベート思考を実施。賛成論点${typedOutput.proArguments.length}個、反対論点${typedOutput.conArguments.length}個を検討し、${typedOutput.keyDisputes.length}個の主要争点を特定しました。最終判断: ${typedOutput.recommendation.decision}（${typedOutput.recommendation.reasoning}）`;
  }

  /**
   * ディベート思考後の次ステップ推奨
   */
  override getNextRecommendations(result: ThinkingResult, phase: DevelopmentPhase): ThinkingMethodType[] {
    const baseRecommendations = super.getNextRecommendations(result, phase);
    
    // ディベート思考後は決定の実行が重要
    const debateSpecific: ThinkingMethodType[] = ['meta'];
    
    // 論点の検証にはクリティカル思考も有効
    if (phase === 'architecture_design') {
      debateSpecific.push('critical');
    }
    
    // 意思決定の実行には論理的思考も重要
    if (phase === 'decision_making') {
      debateSpecific.push('logical');
    }

    return [...new Set([...debateSpecific, ...baseRecommendations])];
  }
}

class DebatePromptTemplate extends LLMPromptTemplate {
  constructor(private agent: DebateThinkingAgent) {
    super();
  }

  protected getSystemPrompt(): string {
    const schemaExample = this.agent.generateSchemaExample(DebateOutput);
    
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
- 感情的にならず論理的に

出力形式（JSON）:
${schemaExample}

必ず上記のJSON形式で出力してください。`;
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
