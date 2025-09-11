import { BaseThinkingAgent, LLMPromptTemplate, type AgentContext, type AgentCapability } from '../core/agent-base.js';
import { 
  ThinkingMethodType, 
  DevelopmentPhase,
  ThinkingResult,
  CriticalInput, 
  CriticalOutput
} from '../schemas/thinking.js';

/**
 * クリティカルシンキング思考エージェント
 * 
 * 機能:
 * 1. 論理を展開する
 * 2. 論点を疑う  
 * 3. 結論と根拠のつながりを疑う
 * 4. 前提を疑う
 * 
 * 適用場面:
 * - リファクタリング
 * - コードレビュー  
 * - 要件定義（前提潰し）
 * - 価値仮説の妥当性確認
 * - 実験/ABテスト設計
 */
export class CriticalThinkingAgent extends BaseThinkingAgent {
  readonly capability: AgentCapability = {
    methodType: 'critical' as ThinkingMethodType,
    description: '前提・論点・根拠を体系的に疑い、論理の矛盾や飛躍を特定・補強する',
    applicablePhases: [
      'refactoring',
      'code_review',
      'requirement_definition',
      'value_hypothesis',
      'experimentation',
      'hypothesis_breakdown'
    ] as DevelopmentPhase[],
    requiredInputSchema: CriticalInput,
    outputSchema: CriticalOutput,
    combinationSynergies: ['logical', 'pac', 'debate'] as ThinkingMethodType[],
  };

  /**
   * LLMを使ったクリティカルシンキング思考の実行
   */
  protected async executeLLMThinking(input: unknown, context: AgentContext): Promise<Record<string, unknown>> {
    const typedInput = input as { claim: string; evidence?: string[]; context?: string };
    const promptTemplate = new CriticalThinkingPromptTemplate();
    const { system, user } = promptTemplate.generatePrompts(typedInput);

    // AI SDKのgenerateObjectを使用してスキーマ保証
    const result = await this.callLLMWithStructuredOutput(
      CriticalOutput,
      system,
      user,
      context,
      {
        temperature: 0.4, // 批判的思考には多角的視点が必要
        maxRetries: 3,
        enableAutoRecovery: true,
      }
    );

    return result as Record<string, unknown>;
  }

  /**
   * クリティカルシンキング特有の信頼度計算
   */
  protected override calculateConfidence(output: Record<string, unknown>, _context: AgentContext): number {
    const criticalOutput = output as CriticalOutput;
    
    // 発見された問題点の数と深度から信頼度を算出
    const questionCount = criticalOutput.questioningResults.questionValidity.length +
                         criticalOutput.questioningResults.logicalGaps.length +
                         criticalOutput.questioningResults.assumptionChallenges.length +
                         criticalOutput.questioningResults.biases.length;
    
    // 強み・弱みの分析バランス
    const strengthCount = criticalOutput.strengthsWeaknesses.strengths.length;
    const weaknessCount = criticalOutput.strengthsWeaknesses.weaknesses.length;
    const analysisBalance = strengthCount > 0 && weaknessCount > 0 ? 0.2 : 0;
    
    // 改善提案の具体性
    const recommendationScore = Math.min(criticalOutput.recommendations.length * 0.1, 0.3);
    
    // 基本信頼度 + 分析深度 + バランス + 提案具体性
    const baseConfidence = 0.5;
    const depthScore = Math.min(questionCount * 0.05, 0.3);
    
    return Math.min(baseConfidence + depthScore + analysisBalance + recommendationScore, 1.0);
  }

  /**
   * クリティカルシンキング思考の推論説明生成
   */
  protected override generateReasoningExplanation(
    input: unknown, 
    output: Record<string, unknown>, 
    _context: AgentContext
  ): string {
    const typedInput = input as { claim: string };
    const typedOutput = output as CriticalOutput;
    
    const totalQuestions = Object.values(typedOutput.questioningResults).reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0
    );
    
    const strengthCount = typedOutput.strengthsWeaknesses.strengths.length;
    const weaknessCount = typedOutput.strengthsWeaknesses.weaknesses.length;
    
    return `「${typedInput.claim}」に対してクリティカルシンキングを適用し、${totalQuestions}個の批判的観点を特定しました。分析結果: 強み${strengthCount}点、課題${weaknessCount}点を洗い出し、${typedOutput.recommendations.length}個の改善提案を生成しました。論点・根拠・前提・バイアスの各層で体系的な疑いを適用し、論理の堅牢性を検証しています。`;
  }

  /**
   * クリティカルシンキング思考後の次ステップ推奨
   */
  override getNextRecommendations(result: ThinkingResult, phase: DevelopmentPhase): ThinkingMethodType[] {
    const baseRecommendations = super.getNextRecommendations(result, phase);
    
    // クリティカル思考後は構造化や代替案検討が有効
    const criticalSpecific: ThinkingMethodType[] = ['logical'];
    
    // 前提の問題が多い場合はPAC思考で分解
    if (result.output && typeof result.output === 'object' && result.output !== null && 'questioningResults' in result.output && result.output.questioningResults && typeof result.output.questioningResults === 'object' && result.output.questioningResults !== null && 'assumptionChallenges' in result.output.questioningResults && Array.isArray(result.output.questioningResults.assumptionChallenges) && result.output.questioningResults.assumptionChallenges.length > 2) {
      criticalSpecific.push('pac');
    }
    
    // 意思決定が必要な場合はディベート
    if (phase === 'decision_making' || phase === 'architecture_design') {
      criticalSpecific.push('debate');
    }
    
    // 影響範囲の整理が必要な場合はMECE
    if (phase === 'refactoring' || phase === 'code_review') {
      criticalSpecific.push('mece');
    }

    return [...new Set([...criticalSpecific, ...baseRecommendations])];
  }
}

/**
 * クリティカルシンキング思考用のプロンプトテンプレート
 */
class CriticalThinkingPromptTemplate extends LLMPromptTemplate {
  protected getSystemPrompt(): string {
    return `あなたはクリティカルシンキング（批判的思考）の専門家です。

クリティカルシンキングの手順:
1. 【論点の妥当性検証】: 設定されている問いや論点自体が適切かを疑う
2. 【論理的つながりの検証】: 結論と根拠の間に論理的飛躍がないかを検証  
3. 【前提の妥当性検証】: 暗黙の前提や仮定が現在の状況で適切かを検証
4. 【バイアスの特定】: 思考の偏りや先入観が判断を歪めていないかを確認

重要な原則:
- 「本当にそうか？」という批判的視点を常に保持
- 建設的な疑問提起で論理を補強する（破壊ではなく改善）
- 確証バイアス、権威バイアス、サンプルバイアスなど認知バイアスを警戒
- 強みと弱みの両面を公平に評価
- 具体的な改善提案を含む

出力は必ず指定されたスキーマに従ってください。`;
  }

  protected getUserPrompt(input: unknown): string {
    const { claim, evidence, context } = input as { 
      claim: string; 
      evidence?: string[]; 
      context?: string 
    };

    return `以下の主張に対して、クリティカルシンキングを適用して分析してください。

## 主張・結論
${claim}

${evidence && evidence.length > 0 ? `## 提示されている根拠\n${evidence.map(e => `- ${e}`).join('\n')}\n` : ''}
${context ? `## コンテキスト\n${context}\n` : ''}

## 求める批判的分析

1. **疑問提起の結果**
   - 論点の妥当性への疑問
   - 論理的つながりの検証（飛躍の特定）
   - 前提・仮定への挑戦
   - 思考バイアスの特定

2. **強み・弱みの評価**
   - 主張の強固な点
   - 脆弱性や課題
   - 欠落している根拠

3. **改善提案**
   - 論理を補強するための具体的提案
   - 追加調査すべき観点
   - 前提を検証する方法

「疑うこと」を通じて「より良い結論」に導くための建設的な批判的分析を行ってください。`;
  }
}
