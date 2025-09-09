#!/usr/bin/env node

import { readFileSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';

import { ThinkingOrchestrator } from '../orchestrator/thinking-orchestrator.js';
import { 
  ThinkingMethodType, 
  DevelopmentPhase 
} from '../schemas/thinking.js';

/**
 * 簡易CLIアプリケーションクラス
 */
class ThinkingCLI {
  private orchestrator: ThinkingOrchestrator;

  constructor() {
    this.orchestrator = new ThinkingOrchestrator();
  }

  /**
   * メイン実行関数
   */
  async execute(): Promise<void> {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      this.printUsage();
      return;
    }

    const command = args[0];
    
    try {
      switch (command) {
        case 'phase':
          await this.handlePhaseCommand(args);
          break;
        case 'golden':
          await this.handleGoldenCommand(args);
          break;
        case 'single':
          await this.handleSingleCommand(args);
          break;
        case 'list':
          await this.handleListCommand();
          break;
        case 'recommend':
          await this.handleRecommendCommand(args);
          break;
        case '--help':
        case '-h':
        case 'help':
          this.printUsage();
          break;
        case '--version':
        case '-v':
        case 'version':
          this.printVersion();
          break;
        default:
          console.error(chalk.red(`未知のコマンド: ${command}`));
          this.printUsage();
          process.exit(1);
      }
    } catch (error) {
      this.handleError(error, args.includes('--verbose'));
    }
  }

  /**
   * 局面別思考プロセス実行
   */
  private async handlePhaseCommand(args: string[]): Promise<void> {
    if (args.length < 3) {
      console.error(chalk.red('使用方法: thinking-agents phase <PHASE> <INPUT_JSON>'));
      return;
    }

    const phase = args[1];
    const inputJson = args[2];
    const spinner = ora('思考プロセスを実行中...').start();
    
    try {
      if (!this.isValidPhase(phase)) {
        spinner.fail('無効な局面が指定されました');
        this.printValidPhases();
        return;
      }

      const inputData = this.parseInputData(inputJson);
      
      const result = await this.orchestrator.processPhase(
        phase as DevelopmentPhase,
        inputData,
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
   * 黄金パターン実行
   */
  private async handleGoldenCommand(args: string[]): Promise<void> {
    if (args.length < 2) {
      console.error(chalk.red('使用方法: thinking-agents golden <INPUT_JSON>'));
      return;
    }

    const inputJson = args[1];
    const spinner = ora('黄金パターン（探索→実装）を実行中...').start();
    
    try {
      const inputData = this.parseInputData(inputJson);
      
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
   * 単一思考法実行
   */
  private async handleSingleCommand(args: string[]): Promise<void> {
    if (args.length < 3) {
      console.error(chalk.red('使用方法: thinking-agents single <METHOD> <INPUT_JSON>'));
      return;
    }

    const method = args[1];
    const inputJson = args[2];
    const spinner = ora(`${method}思考を実行中...`).start();
    
    try {
      if (!this.isValidMethod(method)) {
        spinner.fail('無効な思考法が指定されました');
        this.printValidMethods();
        return;
      }

      const inputData = this.parseInputData(inputJson);
      
      const result = await this.orchestrator.processSingleMethod(
        method as ThinkingMethodType,
        inputData,
        {
          llmProvider: 'default',
          sessionId: `single-${Date.now()}`,
        }
      );

      spinner.succeed(`${method}思考完了`);
      this.displaySingleResult(result, false);
      
    } catch (error) {
      spinner.fail(`${method}思考でエラーが発生しました`);
      throw error;
    }
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
   * 推奨思考法表示
   */
  private async handleRecommendCommand(args: string[]): Promise<void> {
    if (args.length < 2) {
      console.error(chalk.red('使用方法: thinking-agents recommend <PHASE>'));
      return;
    }

    const phase = args[1];

    if (!this.isValidPhase(phase)) {
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

    const rec = recommendations[phase];
    if (!rec) {
      console.log(chalk.yellow('この局面の推奨情報は準備中です'));
      return;
    }

    console.log(chalk.blue.bold(`局面: ${phase}`));
    console.log(chalk.gray(`目的: ${rec.purpose}`));
    console.log('');
    console.log(chalk.green(`主要思考法: ${rec.primary}`));
    console.log(`併用推奨: ${rec.secondary.join(', ')}`);
  }

  /**
   * 使用方法表示
   */
  private printUsage(): void {
    console.log(chalk.blue.bold('CONFLUX 思考法ツール'));
    console.log('');
    console.log('使用方法:');
    console.log('  thinking-agents <command> [options]');
    console.log('');
    console.log('コマンド:');
    console.log('  phase <PHASE> <INPUT>     局面別思考プロセス実行');
    console.log('  golden <INPUT>            黄金パターン実行');
    console.log('  single <METHOD> <INPUT>   単一思考法実行');
    console.log('  list                      利用可能な思考法一覧');
    console.log('  recommend <PHASE>         局面別推奨思考法');
    console.log('  help                      このヘルプを表示');
    console.log('  version                   バージョン情報を表示');
    console.log('');
    console.log('例:');
    console.log('  thinking-agents phase debugging \'{"issue": "APIエラー"}\'');
    console.log('  thinking-agents golden \'{"problem": "新機能設計"}\'');
    console.log('  thinking-agents single critical \'{"claim": "この実装で十分"}\'');
  }

  /**
   * バージョン情報表示
   */
  private printVersion(): void {
    try {
      const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
      console.log(`CONFLUX Thinking Agents MCP v${packageJson.version || '0.1.0'}`);
    } catch {
      console.log('CONFLUX Thinking Agents MCP v0.1.0');
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
   * 局面の妥当性確認
   */
  private isValidPhase(phase: string): boolean {
    const validPhases = [
      'business_exploration', 'requirement_definition', 'value_hypothesis',
      'architecture_design', 'prioritization', 'estimation_planning',
      'implementation', 'debugging', 'refactoring', 'code_review',
      'test_design', 'experimentation', 'decision_making', 'retrospective',
      'hypothesis_breakdown'
    ];
    return validPhases.includes(phase);
  }

  /**
   * 思考法の妥当性確認
   */
  private isValidMethod(method: string): boolean {
    const validMethods = [
      'abduction', 'logical', 'critical', 'mece', 'deductive',
      'inductive', 'pac', 'meta', 'debate'
    ];
    return validMethods.includes(method);
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

// スクリプトとして実行された場合のみmainを実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
