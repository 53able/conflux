import { BaseThinkingAgent, LLMPromptTemplate, type AgentContext, type AgentCapability } from '../core/agent-base.js';
import { 
  ThinkingMethodType, 
  DevelopmentPhase,
  ThinkingResult,
  AbductionInput, 
  AbductionOutput
} from '../schemas/thinking.js';

/**
 * アブダクション思考エージェント
 * 
 * 機能:
 * 1. 驚くべき事実に出合う
 * 2. 説明仮説を立てる 
 * 3. 説明仮説を検証する
 * 
 * 適用場面:
 * - 事業/課題の探索
 * - デバッグ/障害対応
 * - 未知の現象の分析
 */
export class AbductionAgent extends BaseThinkingAgent {
  readonly capability: AgentCapability = {
    methodType: 'abduction' as ThinkingMethodType,
    description: '驚きの事実から最尤説明仮説を形成し、検証可能な予測を導出する',
    applicablePhases: [
      'business_exploration',
      'debugging', 
      'experimentation',
      'hypothesis_breakdown'
    ] as DevelopmentPhase[],
    requiredInputSchema: AbductionInput,
    outputSchema: AbductionOutput,
    combinationSynergies: ['deductive', 'inductive', 'critical'] as ThinkingMethodType[],
  };

  /**
   * LLMを使った アブダクション思考の実行（自動復旧機能付き）
   */
  protected async executeLLMThinking(input: unknown, context: AgentContext): Promise<Record<string, unknown>> {
    const typedInput = input as { surprisingFact: string; context?: string; domain?: string };
    const promptTemplate = new AbductionPromptTemplate();
    const { system, user } = promptTemplate.generatePrompts(typedInput);

    // AI SDKのgenerateObjectを使用してスキーマ保証
    const result = await this.callLLMWithStructuredOutput(
      AbductionOutput,
      system,
      user,
      context,
      {
        temperature: 0.7, // 創造的な仮説生成のために少し高め
        maxRetries: 3,
        enableAutoRecovery: true,
      }
    );

    return result as Record<string, unknown>;
  }

  /**
   * アブダクション思考特有の信頼度計算
   */
  protected override calculateConfidence(output: Record<string, unknown>, context: AgentContext): number {
    const abductionOutput = output as AbductionOutput;
    
    // 仮説数と妥当性スコアから信頼度を算出
    const avgPlausibility = abductionOutput.hypotheses.reduce(
      (sum, h) => sum + h.plausibility, 0
    ) / abductionOutput.hypotheses.length;
    
    // 仮説の多様性もプラス要因
    const diversityBonus = Math.min(abductionOutput.hypotheses.length * 0.1, 0.3);
    
    return Math.min(avgPlausibility + diversityBonus, 1.0);
  }

  /**
   * アブダクション思考の推論説明生成
   */
  protected override generateReasoningExplanation(
    input: unknown, 
    output: Record<string, unknown>, 
    context: AgentContext
  ): string {
    const typedInput = input as { surprisingFact: string; context?: string };
    const typedOutput = output as AbductionOutput;
    
    const topHypothesis = typedOutput.hypotheses.reduce((best, current) => 
      current.plausibility > best.plausibility ? current : best
    );

    return `「${typedInput.surprisingFact}」という驚くべき事実に対して、${typedOutput.hypotheses.length}個の説明仮説を生成しました。最も有望な仮説は「${topHypothesis.explanation}」（妥当性: ${(topHypothesis.plausibility * 100).toFixed(1)}%）です。この仮説は${topHypothesis.testablePredicitions.length}個の検証可能な予測を含んでいます。`;
  }

  /**
   * アブダクション思考後の次ステップ推奨
   */
  override getNextRecommendations(result: ThinkingResult, phase: DevelopmentPhase): ThinkingMethodType[] {
    const baseRecommendations = super.getNextRecommendations(result, phase);
    
    // アブダクション後は仮説検証が重要
    const abductionSpecific: ThinkingMethodType[] = ['deductive', 'inductive'];
    
    // 複数仮説がある場合はクリティカル思考で精査
    if (result.output && 'hypotheses' in result.output && Array.isArray(result.output.hypotheses) && result.output.hypotheses.length > 1) {
      abductionSpecific.push('critical');
    }

    return [...new Set([...abductionSpecific, ...baseRecommendations])];
  }
}

/**
 * アブダクション思考用のプロンプトテンプレート
 */
class AbductionPromptTemplate extends LLMPromptTemplate {
  protected getSystemPrompt(): string {
    return `あなたはアブダクション（仮説形成）思考の専門家です。

アブダクション思考の手順:
1. 【驚くべき事実の特定】: 提示された現象の「予想外」「意外」な側面を明確化
2. 【説明仮説の生成】: その事実を最も合理的に説明できる仮説を複数生成
3. 【検証計画の立案】: 各仮説から導かれる予測可能な結果を特定

重要な原則:
- 帰納的思考との違い: 単なるパターン認識ではなく「なぜそうなるのか」の因果メカニズムを重視
- 複数の競合する仮説を生成し、それぞれの妥当性を評価
- 各仮説から演繹的に導かれる「検証可能な予測」を明示
- 最尤仮説を選択しつつ、代替仮説の可能性も保持

出力は必ず指定されたスキーマに従ってください。`;
  }

  protected getUserPrompt(input: unknown): string {
    const { surprisingFact, context, domain } = input as { 
      surprisingFact: string; 
      context?: string; 
      domain?: string 
    };

    return `以下の驚くべき事実について、アブダクション思考を適用して分析してください。

## 驚くべき事実
${surprisingFact}

${context ? `## コンテキスト\n${context}\n` : ''}
${domain ? `## 対象ドメイン\n${domain}\n` : ''}

## 求める分析

1. **説明仮説の生成** (3-5個)
   - この事実を最も合理的に説明できる仮説
   - 各仮説の妥当性スコア (0-1)
   - 仮説が正しい場合に予測される兆候/結果

2. **推奨次ステップ**
   - この仮説検証に最適な次の思考法
   - 検証実験の方向性

アブダクション思考の本質である「最尤説明の推論」を重視し、創造的かつ論理的な分析を行ってください。`;
  }
}
