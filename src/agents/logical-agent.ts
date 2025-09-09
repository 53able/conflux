import { generateObject } from 'ai';
import { BaseThinkingAgent, LLMPromptTemplate, type AgentContext, type AgentCapability } from '../core/agent-base.js';
import { 
  ThinkingMethodType, 
  LogicalInput, 
  LogicalOutput,
  DevelopmentPhase 
} from '../schemas/thinking.js';

/**
 * ロジカルシンキング思考エージェント
 * 
 * 機能:
 * 1. 論点を決める
 * 2. 情報を集める
 * 3. 何がいえるかを考える
 * 4. 論理を構造化する
 * 
 * 適用場面:
 * - 要件定義
 * - 見積もり/計画
 * - 優先順位付け
 * - ふりかえり/改善
 */
export class LogicalThinkingAgent extends BaseThinkingAgent {
  readonly capability: AgentCapability = {
    methodType: 'logical' as ThinkingMethodType,
    description: '論点から結論への論理的道筋を構築し、ピラミッド構造で整理する',
    applicablePhases: [
      'requirement_definition',
      'prioritization', 
      'estimation_planning',
      'retrospective'
    ] as DevelopmentPhase[],
    requiredInputSchema: LogicalInput,
    outputSchema: LogicalOutput,
    combinationSynergies: ['mece', 'critical', 'meta'] as ThinkingMethodType[],
  };

  /**
   * LLMを使ったロジカルシンキング思考の実行
   */
  protected async executeLLMThinking(input: unknown, context: AgentContext): Promise<Record<string, unknown>> {
    const typedInput = input as { question: string; information?: string[]; constraints?: string[] };
    const promptTemplate = new LogicalThinkingPromptTemplate();
    const { system, user } = promptTemplate.generatePrompts(typedInput);

    // 自動復旧機能付きでLLMを呼び出し
    const result = await this.callLLMWithAutoRecovery(
      LogicalOutput,
      system,
      user,
      context,
      {
        temperature: 0.3, // 論理的思考なので創造性よりも一貫性を重視
        maxRetries: 3,
        enableAutoRecovery: true,
      }
    );

    return result as Record<string, unknown>;
  }

  /**
   * ロジカルシンキング特有の信頼度計算
   */
  protected override calculateConfidence(output: Record<string, unknown>, context: AgentContext): number {
    const logicalOutput = output as LogicalOutput;
    
    // 論理ステップの数と根拠の豊富さから信頼度を算出
    const stepCount = logicalOutput.reasoning.length;
    const evidenceCount = logicalOutput.reasoning.reduce(
      (sum, step) => sum + step.evidence.length, 0
    );
    
    // ピラミッド構造の完成度
    const pyramidCompleteness = logicalOutput.pyramid.supports.length > 0 ? 0.3 : 0;
    
    // 基本信頼度 + ステップ評価 + 根拠評価 + 構造評価
    const baseConfidence = 0.4;
    const stepScore = Math.min(stepCount * 0.1, 0.3);
    const evidenceScore = Math.min(evidenceCount * 0.05, 0.2);
    
    return Math.min(baseConfidence + stepScore + evidenceScore + pyramidCompleteness, 1.0);
  }

  /**
   * ロジカルシンキング思考の推論説明生成
   */
  protected override generateReasoningExplanation(
    input: unknown, 
    output: Record<string, unknown>, 
    context: AgentContext
  ): string {
    const typedInput = input as { question: string };
    const typedOutput = output as LogicalOutput;
    
    return `「${typedInput.question}」という論点に対して、${typedOutput.reasoning.length}段階の論理展開を行いました。結論: ${typedOutput.conclusion}。論理構造はピラミッド形式で整理され、${typedOutput.pyramid.supports.length}個の主要な支点で結論を支えています。各ステップは根拠に基づいており、「Why So（なぜなら）」「So What（だから）」の論理的つながりを確保しています。`;
  }

  /**
   * ロジカルシンキング思考後の次ステップ推奨
   */
  override getNextRecommendations(result: any, phase: DevelopmentPhase): ThinkingMethodType[] {
    const baseRecommendations = super.getNextRecommendations(result, phase);
    
    // ロジカルシンキング後は前提の検証が重要
    const logicalSpecific: ThinkingMethodType[] = ['critical'];
    
    // 分類や整理が必要な場合はMECE
    if (phase === 'prioritization' || phase === 'requirement_definition') {
      logicalSpecific.push('mece');
    }
    
    // 計画段階ではメタ思考で手順の妥当性確認
    if (phase === 'estimation_planning') {
      logicalSpecific.push('meta');
    }

    return [...new Set([...logicalSpecific, ...baseRecommendations])];
  }
}

/**
 * ロジカルシンキング思考用のプロンプトテンプレート
 */
class LogicalThinkingPromptTemplate extends LLMPromptTemplate {
  protected getSystemPrompt(): string {
    return `あなたはロジカルシンキング（論理的思考）の専門家です。

ロジカルシンキングの手順:
1. 【論点の明確化】: 何について考えるのかを具体的に設定
2. 【情報収集・整理】: 論点に関連する情報を体系的に整理
3. 【解釈・推論】: 情報から何がいえるかを段階的に導出
4. 【論理構造化】: 結論とそれを支える根拠をピラミッド構造で整理

重要な原則:
- 「Why So（なぜなら）」「So What（だから）」のつながりを明確化
- MECE（漏れなく重複なく）の観点で情報を整理
- 根拠と結論の論理的飛躍を避ける
- 結論を頂点とした階層構造で全体を可視化

出力は必ず指定されたスキーマに従ってください。`;
  }

  protected getUserPrompt(input: unknown): string {
    const { question, information, constraints } = input as { 
      question: string; 
      information?: string[]; 
      constraints?: string[] 
    };

    return `以下の論点について、ロジカルシンキングを適用して分析してください。

## 論点
${question}

${information && information.length > 0 ? `## 既知の情報\n${information.map(info => `- ${info}`).join('\n')}\n` : ''}
${constraints && constraints.length > 0 ? `## 制約条件\n${constraints.map(constraint => `- ${constraint}`).join('\n')}\n` : ''}

## 求める分析

1. **段階的推論プロセス**
   - 各ステップでの論理展開
   - ステップごとの根拠と推論
   - 「Why So」「So What」の連鎖

2. **論理構造（ピラミッド）**
   - 結論を頂点とした階層構造
   - 結論を支える主要な支点
   - 各支点の根拠

3. **最終結論**
   - 論点に対する明確な回答
   - 結論に至る論理的道筋の要約

論理の一貫性と根拠の妥当性を重視し、読み手が納得できる構造化された思考プロセスを提示してください。`;
  }
}
