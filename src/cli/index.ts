#!/usr/bin/env node

import { readFileSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';

import { object, or, command, argument } from '@optique/core/parser';
import { string } from '@optique/core/valueparser';
import { run } from '@optique/run';

import { ThinkingOrchestrator } from '../orchestrator/thinking-orchestrator.js';
import { 
  ThinkingMethodType, 
  DevelopmentPhase 
} from '../schemas/thinking.js';
import { ThinkingMethodsMCPServer } from '../mcp/server.js';

// シンプルなコマンド型定義（実用優先版）
type PhaseCommandResult = {
  readonly phase: string;
  readonly input: string;
};

type GoldenCommandResult = {
  readonly input: string;
};

type SingleCommandResult = {
  readonly method: string;
  readonly input: string;
};

type RecommendCommandResult = {
  readonly phase: string;
};

type ListCommandResult = {};
type ServerCommandResult = {};

// Optiqueが実際に返すデータ構造
type CLICommand = PhaseCommandResult | GoldenCommandResult | SingleCommandResult | RecommendCommandResult | ListCommandResult | ServerCommandResult;

/**
 * 簡易CLIアプリケーションクラス
 */
class ThinkingCLI {
  private orchestrator: ThinkingOrchestrator;

  constructor() {
    this.orchestrator = new ThinkingOrchestrator();
  }

  /**
   * 型安全なCLIパーサーの定義（実用優先版）
   */
  private createParser() {
    // 各サブコマンドのパーサー（位置引数使用）
    const phaseParser = object({
      phase: argument(string()),
      input: argument(string()),
    });

    const goldenParser = object({
      input: argument(string()),
    });

    const singleParser = object({
      method: argument(string()),
      input: argument(string()),
    });

    const listParser = object({});

    const recommendParser = object({
      phase: argument(string()),
    });

    const serverParser = object({});

    // サブコマンド定義（シンプル構造）
    return or(
      command('phase', phaseParser),
      command('golden', goldenParser),
      command('single', singleParser),
      command('list', listParser),
      command('recommend', recommendParser),
      command('server', serverParser),
      command('mcp', serverParser)
    );
  }

  /**
   * メイン実行関数（Optiqueベース）
   */
  async execute(): Promise<void> {
    try {
      const parser = this.createParser();
      const config = run(parser);

      // コマンド別の処理
      await this.handleCommand(config);

    } catch (error) {
      this.handleError(error, false);
    }
  }

  /**
   * 型安全なコマンド処理
   */
  private async handleCommand(config: CLICommand): Promise<void> {
    try {
      // コマンドを判定してディスパッチ
      if (this.isPhaseCommand(config)) {
        await this.handlePhaseCommandTyped(config);
      } else if (this.isGoldenCommand(config)) {
        await this.handleGoldenCommandTyped(config);
      } else if (this.isSingleCommand(config)) {
        await this.handleSingleCommandTyped(config);
      } else if (this.isRecommendCommand(config)) {
        await this.handleRecommendCommandTyped(config);
      } else if (this.isListCommand(config)) {
        await this.handleListCommand();
      } else {
        await this.handleServerCommand();
      }
    } catch (error) {
      this.handleError(error, false);
    }
  }

  /**
   * 型ガード関数群（シンプル版）
   */
  private isPhaseCommand(config: CLICommand): config is PhaseCommandResult {
    return 'phase' in config && 'input' in config;
  }

  private isGoldenCommand(config: CLICommand): config is GoldenCommandResult {
    return 'input' in config && !('phase' in config) && !('method' in config);
  }

  private isSingleCommand(config: CLICommand): config is SingleCommandResult {
    return 'method' in config && 'input' in config;
  }

  private isRecommendCommand(config: CLICommand): config is RecommendCommandResult {
    return 'phase' in config && !('input' in config);
  }

  private isListCommand(config: CLICommand): config is ListCommandResult {
    return !('phase' in config) && !('input' in config) && !('method' in config);
  }

  /**
   * バージョン情報取得
   */
  private getVersion(): string {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      return `CONFLUX Thinking Agents MCP v${packageJson.version || '0.1.6'}`;
    } catch {
      return 'CONFLUX Thinking Agents MCP v0.1.6';
    }
  }

  /**
   * 型安全な局面別思考プロセス実行（拡張版）
   */
  private async handlePhaseCommandTyped(config: PhaseCommandResult): Promise<void> {
    const spinner = ora('思考プロセスを実行中...').start();
    
    try {
      // 局面の妥当性チェック
      if (!this.isValidPhase(config.phase)) {
        spinner.fail(`無効な局面が指定されました: ${config.phase}`);
        this.printValidPhases();
        return;
      }

      // 入力データのバリデーション
      const validation = this.validateInputData(config.input, '局面別思考プロセス');
      if (!validation.isValid) {
        spinner.fail(`入力データエラー: ${validation.error}`);
        console.log(chalk.yellow('正しい形式例: \'{"issue":"問題の説明","context":"追加の背景情報"}\''));
        return;
      }

      // デバッグ情報表示
      console.log(chalk.gray(`実行局面: ${config.phase}`));

      const result = await this.orchestrator.processPhase(
        config.phase as DevelopmentPhase,
        validation.data!,
        {
          llmProvider: 'default',
          sessionId: `cli-${Date.now()}`,
        }
      );

      spinner.succeed('思考プロセス完了');
      this.displayResult(result, false);
      
    } catch (error) {
      spinner.fail('思考プロセスでエラーが発生しました');
      throw error;
    }
  }

  /**
   * 型安全な黄金パターン実行
   */
  private async handleGoldenCommandTyped(config: GoldenCommandResult): Promise<void> {
    const spinner = ora('黄金パターン（探索→実装）を実行中...').start();
    
    try {
      const inputData = this.parseInputData(config.input);
      
      const result = await this.orchestrator.processGoldenPattern(
        inputData,
        {
          llmProvider: 'default',
          sessionId: `golden-${Date.now()}`,
        }
      );

      spinner.succeed('黄金パターン完了');
      this.displayResult(result, false);
      
    } catch (error) {
      spinner.fail('黄金パターンでエラーが発生しました');
      throw error;
    }
  }

  /**
   * 型安全な単一思考法実行（拡張版）
   */
  private async handleSingleCommandTyped(config: SingleCommandResult): Promise<void> {
    const spinner = ora(`${config.method}思考を実行中...`).start();
    
    try {
      // 思考法の妥当性チェック
      if (!this.isValidMethod(config.method)) {
        spinner.fail(`無効な思考法が指定されました: ${config.method}`);
        this.printValidMethods();
        return;
      }

      // 入力データのバリデーション
      const validation = this.validateInputData(config.input, '単一思考法');
      if (!validation.isValid) {
        spinner.fail(`入力データエラー: ${validation.error}`);
        console.log(chalk.yellow('正しい形式例: \'{"claim":"検証したい主張","evidence":"根拠となる情報"}\''));
        return;
      }

      // デバッグ情報表示
      console.log(chalk.gray(`実行思考法: ${config.method}`));

      const result = await this.orchestrator.processSingleMethod(
        config.method as ThinkingMethodType,
        validation.data!,
        {
          llmProvider: 'default',
          sessionId: `single-${Date.now()}`,
        }
      );

      spinner.succeed(`${config.method}思考完了`);
      this.displaySingleResult(result, false);
      
    } catch (error) {
      spinner.fail(`${config.method}思考でエラーが発生しました`);
      throw error;
    }
  }

  /**
   * 型安全な推奨思考法表示
   */
  private async handleRecommendCommandTyped(config: RecommendCommandResult): Promise<void> {
    if (!this.isValidPhase(config.phase)) {
      console.error(chalk.red('無効な局面が指定されました'));
      this.printValidPhases();
      return;
    }

    const recommendations: Record<string, { primary: string; secondary: string[]; purpose: string }> = {
      business_exploration: { 
        primary: 'abduction', 
        secondary: ['inductive', 'deductive', 'meta'],
        purpose: '驚きから仮説形成' 
      },
      requirement_definition: { 
        primary: 'logical', 
        secondary: ['mece', 'critical'],
        purpose: '論点→結論の道筋を作る' 
      },
      debugging: { 
        primary: 'abduction', 
        secondary: ['deductive', 'inductive'],
        purpose: '兆候→最尤原因仮説' 
      },
      refactoring: { 
        primary: 'critical', 
        secondary: ['mece', 'logical'],
        purpose: '"本当に必要？"を疑う' 
      },
    };

    const rec = recommendations[config.phase];
    if (!rec) {
      console.log(chalk.yellow('この局面の推奨情報は準備中です'));
      return;
    }

    console.log(chalk.blue.bold(`局面: ${config.phase}`));
    console.log(chalk.gray(`目的: ${rec.purpose}`));
    console.log('');
    console.log(chalk.green(`主要思考法: ${rec.primary}`));
    console.log(`併用推奨: ${rec.secondary.join(', ')}`);
  }


  /**
   * 思考法一覧表示
   */
  private async handleListCommand(): Promise<void> {
    const methods = [
      { name: 'abduction', description: '驚きの事実から説明仮説を形成' },
      { name: 'logical', description: '論点から結論への論理的道筋を構築' },
      { name: 'critical', description: '前提・論点・根拠を体系的に疑う' },
      { name: 'mece', description: '項目を漏れなく重複なく分類' },
      { name: 'deductive', description: '一般原則から具体的結論を導出' },
      { name: 'inductive', description: '個別事例から共通パターンを発見' },
      { name: 'pac', description: '前提・仮定・結論に分解して検証' },
      { name: 'meta', description: '思考プロセス自体を評価・改善' },
      { name: 'debate', description: '賛成・反対の論点を体系的に検討' },
    ];

    console.log(chalk.blue.bold('利用可能な思考法:'));
    console.log('');

    methods.forEach(method => {
      console.log(`${chalk.green(method.name.padEnd(12))} ${method.description}`);
    });
  }


  /**
   * MCPサーバーコマンドを処理
   */
  private async handleServerCommand(): Promise<void> {
    try {
      console.log(chalk.cyan('🚀 Starting MCP Server...'));
      const server = new ThinkingMethodsMCPServer();
      await server.start();
    } catch (error) {
      console.error(chalk.red('❌ Failed to start MCP server:'));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      }
      process.exit(1);
    }
  }


  /**
   * 入力データの解析
   */
  private parseInputData(input: string): Record<string, unknown> {
    try {
      return JSON.parse(input);
    } catch {
      return { content: input };
    }
  }

  /**
   * 結果の表示（統合結果用）
   */
  private displayResult(result: any, quiet: boolean): void {
    if (!quiet) {
      console.log(chalk.blue.bold(`🎯 局面: ${result.phase}`));
      console.log(chalk.green(`主要思考法: ${result.primaryMethod}`));
      console.log(chalk.gray(`併用思考法: ${result.secondaryMethods.join(', ')}`));
      console.log(`信頼度: ${(result.confidence * 100).toFixed(1)}%`);
      console.log('');
    }

    console.log(chalk.yellow.bold('📝 統合分析:'));
    console.log(result.synthesis);
    console.log('');

    if (result.actionItems.length > 0) {
      console.log(chalk.red.bold('🎯 アクションアイテム:'));
      result.actionItems.forEach((item: string, index: number) => {
        console.log(`${index + 1}. ${item}`);
      });
      console.log('');
    }

    if (result.nextSteps.length > 0) {
      console.log(chalk.cyan.bold('➡️  次のステップ:'));
      result.nextSteps.forEach((step: string, index: number) => {
        console.log(`${index + 1}. ${step}`);
      });
    }
  }

  /**
   * 結果の表示（単一思考法結果用）
   */
  private displaySingleResult(result: any, quiet: boolean): void {
    if (!quiet) {
      console.log(chalk.blue.bold(`🧠 思考法: ${result.method}`));
      console.log(`信頼度: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`ステータス: ${result.status}`);
      console.log('');
    }

    console.log(chalk.yellow.bold('📝 推論:'));
    console.log(result.reasoning);
    console.log('');

    if (result.output) {
      console.log(chalk.green.bold('📊 結果:'));
      console.log(JSON.stringify(result.output, null, 2));
    }
  }

  /**
   * 局面の妥当性確認（拡張版）
   */
  private isValidPhase(phase: string): boolean {
    const validPhases = {
      'business_exploration': '事業探索',
      'requirement_definition': '要求定義', 
      'value_hypothesis': '価値仮説',
      'architecture_design': 'アーキテクチャ設計',
      'prioritization': '優先度付け',
      'estimation_planning': '見積もり・計画',
      'implementation': '実装',
      'debugging': 'デバッグ',
      'refactoring': 'リファクタリング',
      'code_review': 'コードレビュー',
      'test_design': 'テスト設計',
      'experimentation': '実験',
      'decision_making': '意思決定',
      'retrospective': '振り返り',
      'hypothesis_breakdown': '仮説分解'
    };
    return phase in validPhases;
  }

  /**
   * 思考法の妥当性確認（拡張版）
   */
  private isValidMethod(method: string): boolean {
    const validMethods = {
      'abduction': 'アブダクション（驚きから仮説形成）',
      'logical': 'ロジカル（論点→結論の道筋）',
      'critical': 'クリティカル（前提・論点・根拠を疑う）',
      'mece': 'MECE（漏れなく重複なく分類）',
      'deductive': '演繹的（一般→具体）',
      'inductive': '帰納的（個別→共通パターン）',
      'pac': 'PAC（前提・仮定・結論）',
      'meta': 'メタ（思考プロセス評価）',
      'debate': 'ディベート（賛成・反対論点）'
    };
    return method in validMethods;
  }

  /**
   * 入力データの詳細バリデーション
   */
  private validateInputData(input: string, context: string): { isValid: boolean; error?: string; data?: Record<string, unknown> } {
    // 空文字チェック
    if (!input || input.trim().length === 0) {
      return {
        isValid: false,
        error: `${context}の入力データが空です`
      };
    }

    try {
      const data = JSON.parse(input);
      
      // オブジェクト形式チェック
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return {
          isValid: false,
          error: `${context}の入力データはJSONオブジェクト形式である必要があります`
        };
      }

      // 最小限の内容チェック
      const keys = Object.keys(data);
      if (keys.length === 0) {
        return {
          isValid: false,
          error: `${context}の入力データは空のオブジェクトです。少なくとも1つのフィールドが必要です`
        };
      }

      return {
        isValid: true,
        data
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        isValid: false,
        error: `${context}の入力データが無効なJSON形式です: ${errorMessage}`
      };
    }
  }

  /**
   * 有効な局面一覧表示
   */
  private printValidPhases(): void {
    console.log(chalk.yellow('有効な局面:'));
    const phases = [
      'business_exploration', 'requirement_definition', 'value_hypothesis',
      'architecture_design', 'prioritization', 'estimation_planning',
      'implementation', 'debugging', 'refactoring', 'code_review',
      'test_design', 'experimentation', 'decision_making', 'retrospective',
      'hypothesis_breakdown'
    ];
    phases.forEach(phase => console.log(`  ${phase}`));
  }

  /**
   * 有効な思考法一覧表示
   */
  private printValidMethods(): void {
    console.log(chalk.yellow('有効な思考法:'));
    const methods = [
      'abduction', 'logical', 'critical', 'mece', 'deductive',
      'inductive', 'pac', 'meta', 'debate'
    ];
    methods.forEach(method => console.log(`  ${method}`));
  }

  /**
   * エラーハンドリング
   */
  private handleError(error: unknown, verbose: boolean): void {
    if (verbose) {
      console.error(chalk.red('詳細エラー:'), error);
    } else {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(chalk.red(`エラー: ${message}`));
    }
    process.exit(1);
  }
}

// メイン実行
async function main() {
  const cli = new ThinkingCLI();
  await cli.execute();
}

// メイン実行（npxでも確実に動作するように）
main().catch(console.error);
