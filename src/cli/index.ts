#!/usr/bin/env node

import { readFileSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';

import { Command } from 'commander';

import { ThinkingOrchestrator } from '../orchestrator/thinking-orchestrator.js';
import { globalLLMManager } from '../core/llm-provider.js';
import { 
  ThinkingMethodType, 
  DevelopmentPhase,
  IntegratedThinkingResult,
  ThinkingResult
} from '../schemas/thinking.js';

/**
 * CLIオプションの型定義
 */
interface CLIOptions {
  verbose?: boolean;
}

// コマンドハンドラーの型定義（将来の拡張用）
// type CommandHandler = (options: CLIOptions) => Promise<void>;
import { ThinkingMethodsMCPServer } from '../mcp/server.js';

/**
 * Commander.jsベースのCLIアプリケーションクラス
 */
class ThinkingCLI {
  private orchestrator: ThinkingOrchestrator;

  constructor() {
    this.orchestrator = new ThinkingOrchestrator();
  }

  /**
   * Commander.jsベースのメイン実行関数
   */
  async execute(): Promise<void> {
    const program = new Command();

    program
      .name('conflux')
      .description('CONFLUX 思考法ツール - 構造化された思考プロセスを支援')
      .version(this.getVersion());

    // 共通オプション
    program.option('-v, --verbose', '詳細な出力を表示');

    // phase コマンド
    program
      .command('phase <phase> <input>')
      .description('局面別思考プロセス実行')
      .action(async (phase: string, input: string, options: CLIOptions) => {
        await this.handlePhaseCommand({ phase, input, verbose: options.verbose ?? false });
      });

    // golden コマンド
    program
      .command('golden <input>')
      .description('黄金パターン実行')
      .action(async (input: string, options: CLIOptions) => {
        await this.handleGoldenCommand({ input, verbose: options.verbose ?? false });
      });

    // single コマンド
    program
      .command('single <method> <input>')
      .description('単一思考法実行')
      .action(async (method: string, input: string, options: CLIOptions) => {
        await this.handleSingleCommand({ method, input, verbose: options.verbose ?? false });
      });

    // list コマンド
    program
      .command('list')
      .description('利用可能な思考法一覧')
      .action(async (options: CLIOptions) => {
        await this.handleListCommand({ verbose: options.verbose ?? false });
      });

    // recommend コマンド
    program
      .command('recommend <phase>')
      .description('局面別推奨思考法')
      .action(async (phase: string, options: CLIOptions) => {
        await this.handleRecommendCommand({ phase, verbose: options.verbose ?? false });
      });

    // server コマンド
    program
      .command('server')
      .description('MCPサーバーを起動')
      .action(async (options: CLIOptions) => {
        await this.handleServerCommand({ verbose: options.verbose ?? false });
      });

    // mcp コマンド（serverと同じ）
    program
      .command('mcp')
      .description('MCPサーバーを起動（serverと同じ）')
      .action(async (options: CLIOptions) => {
        await this.handleServerCommand({ verbose: options.verbose ?? false });
      });

    // パース実行
    await program.parseAsync();
  }

  // コマンドハンドラーの型定義
  private async handlePhaseCommand(config: { phase: string; input: string; verbose?: boolean }): Promise<void> {
    const spinner = ora('思考プロセスを実行中...').start();
    
    try {
      if (!this.isValidPhase(config.phase)) {
        spinner.fail('無効な局面が指定されました');
        this.printValidPhases();
        return;
      }

      const inputData = this.parseInputData(config.input);
      
      const result = await this.orchestrator.processPhase(
        config.phase as DevelopmentPhase,
        inputData,
        {
          llmProvider: globalLLMManager.getProvider(),
          sessionId: `cli-${Date.now()}`,
        }
      );

      spinner.succeed('思考プロセス完了');
      this.displayResult(result, config.verbose || false);
      
    } catch (error) {
      spinner.fail('思考プロセスでエラーが発生しました');
      throw error;
    }
  }

  private async handleGoldenCommand(config: { input: string; verbose?: boolean }): Promise<void> {
    const spinner = ora('黄金パターン（探索→実装）を実行中...').start();
    
    try {
      const inputData = this.parseInputData(config.input);
      
      const result = await this.orchestrator.processGoldenPattern(
        inputData,
        {
          llmProvider: globalLLMManager.getProvider(),
          sessionId: `golden-${Date.now()}`,
        }
      );

      spinner.succeed('黄金パターン完了');
      this.displayResult(result, config.verbose || false);
      
    } catch (error) {
      spinner.fail('黄金パターンでエラーが発生しました');
      throw error;
    }
  }

  private async handleSingleCommand(config: { method: string; input: string; verbose?: boolean }): Promise<void> {
    const spinner = ora(`${config.method}思考を実行中...`).start();
    
    try {
      if (!this.isValidMethod(config.method)) {
        spinner.fail('無効な思考法が指定されました');
        this.printValidMethods();
        return;
      }

      const inputData = this.parseInputData(config.input);
      
      const result = await this.orchestrator.processSingleMethod(
        config.method as ThinkingMethodType,
        inputData,
        {
          llmProvider: globalLLMManager.getProvider(),
          sessionId: `single-${Date.now()}`,
        }
      );

      spinner.succeed(`${config.method}思考完了`);
      this.displaySingleResult(result, config.verbose || false);
      
    } catch (error) {
      spinner.fail(`${config.method}思考でエラーが発生しました`);
      throw error;
    }
  }

  private async handleListCommand(_config: { verbose?: boolean }): Promise<void> {
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

  private async handleRecommendCommand(config: { phase: string; verbose?: boolean }): Promise<void> {
      if (!this.isValidPhase(config.phase)) {
      console.error(chalk.red('無効な局面が指定されました'));
      this.printValidPhases();
      return;
    }

    const recommendations: Record<string, { purpose: string; primary: string; secondary: string[] }> = {
      business_exploration: {
        purpose: '事業・課題の探索と仮説形成',
        primary: 'アブダクション',
        secondary: ['帰納', '演繹', 'メタ'],
      },
      requirement_definition: {
        purpose: '要件の論理的な整理と構造化',
        primary: 'ロジカルシンキング',
        secondary: ['MECE', 'クリティカル'],
      },
      debugging: {
        purpose: '問題の原因特定と解決策の探索',
        primary: 'アブダクション',
        secondary: ['演繹', '帰納'],
      },
      refactoring: {
        purpose: 'コードの改善と構造の最適化',
        primary: 'クリティカルシンキング',
        secondary: ['MECE', 'ロジカル'],
      },
      decision_making: {
        purpose: '重要な意思決定の支援',
        primary: 'ディベート思考',
        secondary: ['メタ'],
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

  private async handleServerCommand(_config: { verbose?: boolean }): Promise<void> {
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
   * バージョン情報取得
   */
  private getVersion(): string {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      return `CONFLUX Thinking Agents MCP v${packageJson.version || '0.1.7'}`;
    } catch {
      return 'CONFLUX Thinking Agents MCP v0.1.7';
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
  private displayResult(result: IntegratedThinkingResult, quiet: boolean): void {
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
  private displaySingleResult(result: ThinkingResult, quiet: boolean): void {
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
