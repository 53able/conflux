#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { getLogger } from '../core/index.js';
import * as E from 'fp-ts/lib/Either.js';
import * as TE from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { getToolsList, executeToolByName } from './tool-handlers.js';
import { getVersion } from './utils.js';
import { SERVER_CONFIG, LOG_MESSAGES } from './constants.js';
import dotenv from 'dotenv';

dotenv.config();

// Logger setup
const logger = getLogger();

/**
 * 思考法MCPサーバー（関数型スタイル）
 * 
 * 提供するツール:
 * 1. process-phase - 局面に応じた統合思考プロセス
 * 2. process-golden-pattern - 黄金パターン（探索→実装）の実行
 * 3. process-single-method - 単一思考法の実行
 * 4. process-custom-strategy - PHASE_THINKING_MAP形式で思考法戦略を指定して実行
 * 5. list-thinking-methods - 利用可能な思考法の一覧
 * 6. get-phase-recommendations - 局面別推奨思考法の取得
 */

export function createThinkingMethodsMCPServer(): Server {
  const server = new Server(
    {
      name: SERVER_CONFIG.NAME,
      version: getVersion(),
    },
    {
      capabilities: {
        tools: {
          listChanged: true,
        },
        prompts: {
          listChanged: true,
        },
      },
    }
  );

  setupToolHandlers(server);
  setupPromptHandlers(server);
  setupErrorHandlers(server);
  
  logger.info(LOG_MESSAGES.SERVER_INITIALIZED, {
    serverName: SERVER_CONFIG.NAME,
    version: getVersion(),
  });
  
  return server;
}

/**
 * ツールハンドラーをセットアップ
 */
function setupToolHandlers(server: Server): void {
  // ツール一覧の提供
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.info('ListTools request received');
    const tools = getToolsList();
    logger.info(LOG_MESSAGES.TOOLS_LIST_RETURNED, { toolsCount: tools.length, toolNames: tools.map(t => t.name) });
    return { tools };
  });

  // ツール実行ハンドラー（自己修復機能付き）
  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<{ [x: string]: unknown; _meta?: { [x: string]: unknown; } | undefined; }> => {
    const { name, arguments: args } = request.params;

    logger.info(LOG_MESSAGES.TOOL_REQUEST_RECEIVED, { name, args });

    const result = await pipe(
      executeToolByName(name, args as Record<string, unknown>),
      TE.chainFirst(() => TE.fromIO(() => logger.info('Tool execution completed successfully', { name }))),
      TE.fold(
        (error: McpError) => {
          // 自己修復機能により、多くのエラーは内部で解決される
          // ここに到達するエラーは修復不可能なエラー
          logger.error(`Tool execution failed after self-healing attempts: ${error.message}`, { 
            error, 
            name, 
            args,
            errorCode: error.code,
            isRepairable: false
          });
          throw error;
        },
        (success) => TE.right(success as { [x: string]: unknown; _meta?: { [x: string]: unknown; } | undefined; })
      )
    )();
    
    return E.fold(
      () => { throw new Error('Unexpected error'); },
      (value) => value as { [x: string]: unknown; _meta?: { [x: string]: unknown; } | undefined; }
    )(result as E.Either<unknown, { [x: string]: unknown; _meta?: { [x: string]: unknown; } | undefined; }>);
  });
}


/**
 * プロンプトハンドラーをセットアップ
 */
function setupPromptHandlers(server: Server): void {
  // プロンプト一覧の提供
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    logger.info('ListPrompts request received');
    const prompts = [
      {
        name: 'thinking-methods-guide',
        description: '思考法の使い方と各局面での推奨思考法について説明します',
        arguments: [
          {
            name: 'phase',
            description: '特定の局面について詳しく知りたい場合（オプション）',
            required: false,
          },
        ],
      },
      {
        name: 'problem-analysis',
        description: '問題分析のための思考プロセスをガイドします',
        arguments: [
          {
            name: 'problem',
            description: '分析したい問題の説明',
            required: true,
          },
        ],
      },
    ];
    logger.info('Returning prompts list', { promptsCount: prompts.length });
    return { prompts };
  });
}

/**
 * エラーハンドラーをセットアップ
 */
function setupErrorHandlers(server: Server): void {
  server.onerror = (error) => {
    logger.error('[MCP Server Error]', { error });
  };

  process.on('SIGINT', async () => {
    logger.info('Shutting down MCP server...');
    await server.close();
    process.exit(0);
  });

  process.on('uncaughtException', (error) => {
    // JSONパースエラーの特別処理
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      logger.error('JSON Parse Error:', { error: error.message });
      // JSONパースエラーの場合は再起動ではなく、エラーレスポンスを返す
      return;
    }
    logger.error('Uncaught Exception', { error });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
    process.exit(1);
  });
}

/**
 * サーバーを開始
 */
async function startServer(server: Server): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info(`Thinking Methods MCP Server running on stdio, port: ${process.env.PORT || SERVER_CONFIG.DEFAULT_PORT}`);
  logger.info(LOG_MESSAGES.SERVER_STARTED, { 
    toolsCount: SERVER_CONFIG.TOOLS_COUNT,
    serverName: SERVER_CONFIG.NAME,
    version: getVersion()
  });
}

// メイン実行
async function main() {
  const server = createThinkingMethodsMCPServer();
  await startServer(server);
}

// スクリプトとして実行された場合のみmainを実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Failed to start server:', { error });
    process.exit(1);
  });
}
