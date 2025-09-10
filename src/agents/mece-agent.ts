import { BaseThinkingAgent, LLMPromptTemplate, type AgentContext, type AgentCapability } from '../core/agent-base.js';
import { 
  ThinkingMethodType, 
  MECEInput, 
  MECEOutput,
  DevelopmentPhase 
} from '../schemas/thinking.js';

/**
 * MECE思考エージェント
 * 
 * 機能:
 * 1. 情報収集の目的を設定する
 * 2. 情報収集の切り口を決める
 * 3. 漏れとダブりをチェックする
 * 
 * 適用場面:
 * - 優先順位付け（バックログ整列）
 * - リファクタリング（影響範囲洗い出し）
 * - コードレビュー（観点漏れ防止）
 * - テスト設計（同値分割・境界網羅）
 */
export class MECEAgent extends BaseThinkingAgent {
  readonly capability: AgentCapability = {
    methodType: 'mece' as ThinkingMethodType,
    description: '項目を漏れなく重複なく分類し、構造化された全体像を構築する',
    applicablePhases: [
      'prioritization',
      'refactoring', 
      'code_review',
      'test_design'
    ] as DevelopmentPhase[],
    requiredInputSchema: MECEInput,
    outputSchema: MECEOutput,
    combinationSynergies: ['logical', 'critical'] as ThinkingMethodType[],
  };

  protected async executeLLMThinking(input: unknown, context: AgentContext): Promise<Record<string, unknown>> {
    const typedInput = input as { purpose: string; items: string[]; proposedCriteria?: string };
    const promptTemplate = new MECEPromptTemplate();
    const { system, user } = promptTemplate.generatePrompts(typedInput);

    // 自動復旧機能付きでLLMを呼び出し
    const result = await this.callLLMWithAutoRecovery(
      MECEOutput,
      system,
      user,
      context,
      {
        temperature: 0.2, // 論理的分類なので低めの温度設定
        maxRetries: 3,
        enableAutoRecovery: true,
      }
    );

    return result as Record<string, unknown>;
  }

  protected override calculateConfidence(output: Record<string, unknown>, _context: AgentContext): number {
    const meceOutput = output as MECEOutput;
    
    // 完全性スコアがベース
    let confidence = meceOutput.completenessScore;
    
    // 漏れやダブりが少ないほど信頼度向上
    const gapPenalty = meceOutput.gaps.length * 0.05;
    const overlapPenalty = meceOutput.overlaps.length * 0.1;
    
    confidence = Math.max(0, confidence - gapPenalty - overlapPenalty);
    
    return Math.min(confidence, 1.0);
  }

  protected override generateReasoningExplanation(
    input: unknown, 
    output: Record<string, unknown>, 
    _context: AgentContext
  ): string {
    const typedInput = input as { purpose: string; items: string[] };
    const typedOutput = output as MECEOutput;
    
    return `「${typedInput.purpose}」を目的として、${typedInput.items.length}個の項目を「${typedOutput.criteria}」の基準で分類しました。結果: ${typedOutput.categories.length}カテゴリに整理、完全性スコア${(typedOutput.completenessScore * 100).toFixed(1)}%。漏れ${typedOutput.gaps.length}個、重複${typedOutput.overlaps.length}個を特定し、MECEの原則に沿って構造化を行いました。`;
  }
}

class MECEPromptTemplate extends LLMPromptTemplate {
  protected getSystemPrompt(): string {
    return `あなたはMECE（Mutually Exclusive and Collectively Exhaustive）思考の専門家です。

MECEの手順:
1. 【目的の明確化】: 分類の目的と意図を明確化
2. 【分類軸の設定】: 目的に最適な切り口を設計
3. 【カテゴリ分け】: 各項目を適切なカテゴリに配置
4. 【完全性チェック】: 漏れ（Missing）とダブり（Overlap）を検証

重要な原則:
- Mutually Exclusive: 各カテゴリが相互排他的（重複なし）
- Collectively Exhaustive: 全体を網羅している（漏れなし）
- 分類軸は目的に対して意味がある変数を選択
- 粒度を揃える（同じレベルの抽象度で分類）`;
  }

  protected getUserPrompt(input: unknown): string {
    const { purpose, items, proposedCriteria } = input as { 
      purpose: string; 
      items: string[]; 
      proposedCriteria?: string 
    };

    return `以下の項目をMECEの原則に従って分類してください。

## 分類目的
${purpose}

## 分類対象項目
${items.map((item, index) => `${index + 1}. ${item}`).join('\n')}

${proposedCriteria ? `## 提案された分類基準\n${proposedCriteria}\n` : ''}

## 求める分析

1. **最適な分類基準の決定**
   - 目的に最も適した切り口
   - 項目の性質を考慮した分類軸

2. **MECE分類の実行**
   - 各カテゴリへの項目配置
   - カテゴリごとのカバレッジ説明

3. **完全性検証**
   - 漏れている項目/観点の特定
   - 重複している項目の指摘
   - 完全性スコア（0-1）の算出

漏れなく重複なく、かつ実用的な分類構造を提示してください。`;
  }
}
