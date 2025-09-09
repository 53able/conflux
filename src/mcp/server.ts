#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { ThinkingOrchestrator } from '../orchestrator/thinking-orchestrator.js';
import { 
  ThinkingMethodType, 
  DevelopmentPhase,
  AbductionInput,
  LogicalInput,
  CriticalInput,
  MECEInput,
  DeductiveInput,
  InductiveInput,
  PACInput,
  MetaInput,
  DebateInput,
} from '../schemas/thinking.js';

/**
 * MCPツールの入力スキーマ定義
 */
const ProcessPhaseInputSchema = z.object({
  phase: DevelopmentPhase,
  input: z.record(z.string(), z.unknown()),
  llmProvider: z.string().optional(),
  userId: z.string().optional(),
});

const ProcessGoldenPatternInputSchema = z.object({
  input: z.record(z.string(), z.unknown()),
  llmProvider: z.string().optional(),
  userId: z.string().optional(),
});

const ProcessSingleMethodInputSchema = z.object({
  method: ThinkingMethodType,
  input: z.record(z.string(), z.unknown()),
  llmProvider: z.string().optional(),
  userId: z.string().optional(),
});

/**
 * 思考法MCPサーバー
 * 
 * 提供するツール:
 * 1. process-phase - 局面に応じた統合思考プロセス
 * 2. process-golden-pattern - 黄金パターン（探索→実装）の実行
 * 3. process-single-method - 単一思考法の実行
 * 4. list-thinking-methods - 利用可能な思考法の一覧
 * 5. get-phase-recommendations - 局面別推奨思考法の取得
 */
export class ThinkingMethodsMCPServer {
  private server: Server;
  private orchestrator: ThinkingOrchestrator;

  constructor() {
    this.server = new Server(
      {
        name: 'thinking-methods-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.orchestrator = new ThinkingOrchestrator();
    this.setupToolHandlers();
    this.setupErrorHandlers();
  }

  /**
   * ツールハンドラーをセットアップ
   */
  private setupToolHandlers(): void {
    // ツール一覧の提供
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'process-phase',
          description: '局面に応じた統合思考プロセスを実行します',
          inputSchema: {
            type: 'object',
            properties: {
              phase: {
                type: 'string',
                enum: [
                  'business_exploration',
                  'requirement_definition', 
                  'value_hypothesis',
                  'architecture_design',
                  'prioritization',
                  'estimation_planning',
                  'implementation',
                  'debugging',
                  'refactoring',
                  'code_review',
                  'test_design',
                  'experimentation',
                  'decision_making',
                  'retrospective',
                  'hypothesis_breakdown',
                ],
                description: '開発の局面',
              },
              input: {
                type: 'object',
                description: '分析対象の入力データ',
              },
              llmProvider: {
                type: 'string',
                description: 'LLMプロバイダー設定',
                optional: true,
              },
              userId: {
                type: 'string', 
                description: 'ユーザーID',
                optional: true,
              },
            },
            required: ['phase', 'input'],
          },
        },
        {
          name: 'process-golden-pattern',
          description: '黄金パターン（探索→実装）の統合思考プロセスを実行します',
          inputSchema: {
            type: 'object',
            properties: {
              input: {
                type: 'object',
                description: '分析対象の入力データ',
              },
              llmProvider: {
                type: 'string',
                description: 'LLMプロバイダー設定',
                optional: true,
              },
              userId: {
                type: 'string',
                description: 'ユーザーID', 
                optional: true,
              },
            },
            required: ['input'],
          },
        },
        {
          name: 'process-single-method',
          description: '単一の思考法を実行します',
          inputSchema: {
            type: 'object',
            properties: {
              method: {
                type: 'string',
                enum: [
                  'abduction',
                  'logical',
                  'deductive',
                  'inductive',
                  'mece',
                  'pac',
                  'meta',
                  'debate',
                  'critical',
                ],
                description: '実行する思考法',
              },
              input: {
                type: 'object',
                description: '思考法への入力データ',
              },
              llmProvider: {
                type: 'string',
                description: 'LLMプロバイダー設定',
                optional: true,
              },
              userId: {
                type: 'string',
                description: 'ユーザーID',
                optional: true,
              },
            },
            required: ['method', 'input'],
          },
        },
        {
          name: 'list-thinking-methods',
          description: '利用可能な思考法の一覧と詳細を取得します',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'get-phase-recommendations',
          description: '指定した局面に推奨される思考法を取得します',
          inputSchema: {
            type: 'object',
            properties: {
              phase: {
                type: 'string',
                enum: [
                  'business_exploration',
                  'requirement_definition',
                  'value_hypothesis',
                  'architecture_design', 
                  'prioritization',
                  'estimation_planning',
                  'implementation',
                  'debugging',
                  'refactoring',
                  'code_review',
                  'test_design',
                  'experimentation',
                  'decision_making',
                  'retrospective',
                  'hypothesis_breakdown',
                ],
                description: '開発の局面',
              },
            },
            required: ['phase'],
          },
        },
      ] as Tool[],
    }));

    // ツール実行ハンドラー
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'process-phase':
            return await this.handleProcessPhase(args);
          case 'process-golden-pattern':
            return await this.handleProcessGoldenPattern(args);
          case 'process-single-method':
            return await this.handleProcessSingleMethod(args);
          case 'list-thinking-methods':
            return await this.handleListThinkingMethods();
          case 'get-phase-recommendations':
            return await this.handleGetPhaseRecommendations(args);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    });
  }

  /**
   * エラーハンドラーをセットアップ
   */
  private setupErrorHandlers(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Server Error]', error);
    };

    process.on('SIGINT', async () => {
      console.log('Shutting down MCP server...');
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * 局面別思考プロセス実行ハンドラー
   */
  private async handleProcessPhase(args: unknown) {
    const parsed = ProcessPhaseInputSchema.parse(args);
    
    const context = {
      llmProvider: parsed.llmProvider || 'default',
      userId: parsed.userId || undefined,
      sessionId: `phase-${Date.now()}`,
    };

    const result = await this.orchestrator.processPhase(
      parsed.phase,
      parsed.input,
      context
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  /**
   * 黄金パターン実行ハンドラー
   */
  private async handleProcessGoldenPattern(args: unknown) {
    const parsed = ProcessGoldenPatternInputSchema.parse(args);
    
    const context = {
      llmProvider: parsed.llmProvider || 'default',
      userId: parsed.userId || undefined,
      sessionId: `golden-${Date.now()}`,
    };

    const result = await this.orchestrator.processGoldenPattern(
      parsed.input,
      context
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  /**
   * 単一思考法実行ハンドラー
   */
  private async handleProcessSingleMethod(args: unknown) {
    const parsed = ProcessSingleMethodInputSchema.parse(args);
    
    const context = {
      llmProvider: parsed.llmProvider || 'default',
      userId: parsed.userId || undefined,
      sessionId: `single-${Date.now()}`,
    };

    const result = await this.orchestrator.processSingleMethod(
      parsed.method,
      parsed.input,
      context
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  /**
   * 思考法一覧取得ハンドラー
   */
  private async handleListThinkingMethods() {
    const methods = [
      {
        name: 'abduction',
        description: '驚きの事実から説明仮説を形成し、検証可能な予測を導出する',
        applicablePhases: ['business_exploration', 'debugging', 'experimentation', 'hypothesis_breakdown'],
        inputExample: { surprisingFact: '予想外の現象', context: 'コンテキスト情報' },
      },
      {
        name: 'logical',
        description: '論点から結論への論理的道筋を構築し、ピラミッド構造で整理する',
        applicablePhases: ['requirement_definition', 'prioritization', 'estimation_planning', 'retrospective'],
        inputExample: { question: '論点・問い', information: ['既知の情報'], constraints: ['制約条件'] },
      },
      {
        name: 'critical',
        description: '前提・論点・根拠を体系的に疑い、論理の矛盾や飛躍を特定・補強する',
        applicablePhases: ['refactoring', 'code_review', 'requirement_definition', 'value_hypothesis'],
        inputExample: { claim: '主張・結論', evidence: ['根拠'], context: 'コンテキスト' },
      },
      {
        name: 'mece',
        description: '項目を漏れなく重複なく分類し、構造化された全体像を構築する',
        applicablePhases: ['prioritization', 'refactoring', 'code_review', 'test_design'],
        inputExample: { purpose: '分類の目的', items: ['分類対象項目'], proposedCriteria: '分類基準' },
      },
      {
        name: 'deductive',
        description: '一般的な原則・理論から具体的な結論を論理的に導出する',
        applicablePhases: ['architecture_design', 'implementation', 'debugging', 'test_design'],
        inputExample: { majorPremise: '大前提', minorPremise: '小前提', domain: '適用領域' },
      },
      {
        name: 'inductive',
        description: '個別事例から共通パターンを発見し一般論を構築する',
        applicablePhases: ['value_hypothesis', 'experimentation', 'debugging'],
        inputExample: { observations: ['観測サンプル'], context: 'コンテキスト' },
      },
      {
        name: 'pac',
        description: '仮説を前提・仮定・結論に分解し、仮定と前提の妥当性を検証する',
        applicablePhases: ['hypothesis_breakdown', 'retrospective'],
        inputExample: { claim: '主張・結論', context: 'コンテキスト' },
      },
      {
        name: 'meta',
        description: '思考プロセス自体を対象化し、より高次の視点から評価・改善する',
        applicablePhases: ['retrospective', 'estimation_planning', 'decision_making'],
        inputExample: { currentThinking: '現在の思考内容', objective: '目的・目標' },
      },
      {
        name: 'debate',
        description: '論題に対する賛成・反対の論点を体系的に検討し意思決定を支援する',
        applicablePhases: ['decision_making', 'architecture_design'],
        inputExample: { proposition: '論題（〇〇すべき形式）', context: '背景情報' },
      },
    ];

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(methods, null, 2),
        },
      ],
    };
  }

  /**
   * 局面別推奨思考法取得ハンドラー
   */
  private async handleGetPhaseRecommendations(args: unknown) {
    const { phase } = z.object({ phase: DevelopmentPhase }).parse(args);
    
    const recommendations = {
      business_exploration: { primary: 'abduction', secondary: ['inductive', 'deductive', 'meta'] },
      requirement_definition: { primary: 'logical', secondary: ['mece', 'critical'] },
      value_hypothesis: { primary: 'inductive', secondary: ['critical'] },
      architecture_design: { primary: 'deductive', secondary: ['debate'] },
      prioritization: { primary: 'mece', secondary: ['logical'] },
      estimation_planning: { primary: 'logical', secondary: ['meta'] },
      implementation: { primary: 'deductive', secondary: ['critical'] },
      debugging: { primary: 'abduction', secondary: ['deductive', 'inductive'] },
      refactoring: { primary: 'critical', secondary: ['mece', 'logical'] },
      code_review: { primary: 'critical', secondary: ['deductive', 'mece'] },
      test_design: { primary: 'deductive', secondary: ['mece', 'inductive'] },
      experimentation: { primary: 'inductive', secondary: ['critical'] },
      decision_making: { primary: 'debate', secondary: ['meta'] },
      retrospective: { primary: 'meta', secondary: ['logical', 'pac'] },
      hypothesis_breakdown: { primary: 'pac', secondary: ['critical'] },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(recommendations[phase], null, 2),
        },
      ],
    };
  }

  /**
   * サーバーを開始
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Thinking Methods MCP Server running on stdio');
  }
}

// メイン実行
async function main() {
  const server = new ThinkingMethodsMCPServer();
  await server.start();
}

// スクリプトとして実行された場合のみmainを実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
