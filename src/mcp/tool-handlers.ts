import { z } from 'zod';
import { McpError, ErrorCode, type Tool } from '@modelcontextprotocol/sdk/types.js';
import { type TaskEither, getLogger, getProvider, generateStructuredOutput, generateText, healthCheck, toLanguageModel } from '../core/index.js';
import * as E from 'fp-ts/lib/Either.js';
import * as TE from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { ThinkingMethodType, DevelopmentPhase } from '../schemas/index.js';
import { 
  ProcessPhaseInputSchema,
  ProcessGoldenPatternInputSchema,
  ProcessSingleMethodInputSchema,
  ProcessCustomStrategyInputSchema,
  PhaseRecommendationsInputSchema
} from './schemas.js';
import { getThinkingMethodsList, getPhaseRecommendations } from './utils.js';
import { 
  processSingleMethodTaskEither, 
  processCustomStrategy,
  processPhaseTaskEither,
  processGoldenPatternTaskEither
} from '../orchestrator/index.js';
import { TOOL_NAMES, SESSION_PREFIXES, LOG_MESSAGES } from './constants.js';
import { executeWithSelfHealing } from './self-healing.js';
import { 
  generateInputSchemaUnion, 
  getDevelopmentPhaseEnum, 
  getThinkingMethodEnum,
  generateBaseInputProperties 
} from './schema-generator.js';

const logger = getLogger();

/**
 * ツール一覧を取得
 */
export function getToolsList(): Tool[] {
  const baseProperties = generateBaseInputProperties();
  const inputSchemaUnion = generateInputSchemaUnion();
  
  return [
    {
      name: TOOL_NAMES.PROCESS_PHASE,
      description: '局面に応じた統合思考プロセスを実行します',
      inputSchema: {
        type: 'object',
        properties: {
          phase: {
            type: 'string',
            enum: getDevelopmentPhaseEnum(),
            description: '開発の局面',
          },
          input: inputSchemaUnion,
          ...baseProperties,
        },
        required: ['phase', 'input'],
      },
    },
    {
      name: TOOL_NAMES.PROCESS_GOLDEN_PATTERN,
      description: '黄金パターン（探索→実装）の統合思考プロセスを実行します',
      inputSchema: {
        type: 'object',
        properties: {
          input: inputSchemaUnion,
          ...baseProperties,
        },
        required: ['input'],
      },
    },
    {
      name: TOOL_NAMES.PROCESS_SINGLE_METHOD,
      description: '単一の思考法を実行します',
      inputSchema: {
        type: 'object',
        properties: {
          method: {
            type: 'string',
            enum: getThinkingMethodEnum(),
            description: '実行する思考法',
          },
          input: inputSchemaUnion,
          ...baseProperties,
        },
        required: ['method', 'input'],
      },
    },
    {
      name: TOOL_NAMES.LIST_THINKING_METHODS,
      description: '利用可能な思考法の一覧と詳細を取得します',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: TOOL_NAMES.GET_PHASE_RECOMMENDATIONS,
      description: '指定した局面に推奨される思考法を取得します',
      inputSchema: {
        type: 'object',
        properties: {
          phase: {
            type: 'string',
            enum: getDevelopmentPhaseEnum(),
            description: '開発の局面',
          },
        },
        required: ['phase'],
      },
    },
    {
      name: TOOL_NAMES.PROCESS_CUSTOM_STRATEGY,
      description: 'PHASE_THINKING_MAP形式で思考法戦略を指定して実行します',
      inputSchema: {
        type: 'object',
        properties: {
          primary: {
            type: 'string',
            enum: getThinkingMethodEnum(),
            description: '主要思考法',
          },
          secondary: {
            type: 'array',
            items: {
              type: 'string',
              enum: getThinkingMethodEnum(),
            },
            description: '併用思考法',
          },
          sequence: {
            type: 'array',
            items: {
              type: 'string',
              enum: getThinkingMethodEnum(),
            },
            minItems: 1,
            description: '実行する思考法の順序',
          },
          input: inputSchemaUnion,
          ...baseProperties,
        },
        required: ['primary', 'secondary', 'sequence', 'input'],
      },
    },
  ];
}

/**
 * ツール名に基づいてツールを実行
 */
export function executeToolByName(
  name: string, 
  args: Record<string, unknown>
): TaskEither<McpError, unknown> {
  switch (name) {
    case TOOL_NAMES.PROCESS_PHASE:
      return handleProcessPhaseTaskEither(args);
    case TOOL_NAMES.PROCESS_GOLDEN_PATTERN:
      return handleProcessGoldenPatternTaskEither(args);
    case TOOL_NAMES.PROCESS_SINGLE_METHOD:
      return handleProcessSingleMethodTaskEither(args);
    case TOOL_NAMES.PROCESS_CUSTOM_STRATEGY:
      return handleProcessCustomStrategyTaskEither(args);
    case TOOL_NAMES.LIST_THINKING_METHODS:
      return handleListThinkingMethodsTaskEither();
    case TOOL_NAMES.GET_PHASE_RECOMMENDATIONS:
      return handleGetPhaseRecommendationsTaskEither(args);
    default:
      return TE.left(new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${name}`
      ));
  }
}

/**
 * 局面別思考プロセス実行ハンドラー（自己修復機能付き）
 */
function handleProcessPhaseTaskEither(args: unknown): TaskEither<McpError, unknown> {
  return executeWithSelfHealing(
    TOOL_NAMES.PROCESS_PHASE,
    args,
    ProcessPhaseInputSchema,
    (parsed) => {
      const typedParsed = parsed as z.infer<typeof ProcessPhaseInputSchema>;
      logger.info(LOG_MESSAGES.PHASE_INPUT_PARSED, { parsed: typedParsed });
      
      const context = {
        llmProvider: toLanguageModel(getProvider()),
        llmIntegration: { generateStructuredOutput, generateText, healthCheck },
        userId: typedParsed.userId || 'mcp-user',
        sessionId: `${SESSION_PREFIXES.PHASE}-${Date.now()}`,
      };

      return pipe(
        processPhaseTaskEither(
          typedParsed.phase,
          typedParsed.input,
          context
        ),
        TE.mapLeft((error: string) => new McpError(
          ErrorCode.InternalError,
          `Phase processing failed: ${error}`
        )),
        TE.map((result) => {
          logger.info(LOG_MESSAGES.PHASE_PROCESSING_COMPLETED, { result });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        })
      );
    }
  );
}

/**
 * 黄金パターン実行ハンドラー（自己修復機能付き）
 */
function handleProcessGoldenPatternTaskEither(args: unknown): TaskEither<McpError, unknown> {
  return executeWithSelfHealing(
    TOOL_NAMES.PROCESS_GOLDEN_PATTERN,
    args,
    ProcessGoldenPatternInputSchema,
    (parsed) => {
      const typedParsed = parsed as { input: Record<string, unknown>; llmProvider?: string; userId?: string };
      const context = {
        llmProvider: toLanguageModel(getProvider()),
        llmIntegration: { generateStructuredOutput, generateText, healthCheck },
        userId: typedParsed.userId || 'mcp-user',
        sessionId: `${SESSION_PREFIXES.GOLDEN}-${Date.now()}`,
      };

      return pipe(
        processGoldenPatternTaskEither(
          typedParsed.input,
          context
        ),
        TE.mapLeft((error: string) => new McpError(
          ErrorCode.InternalError,
          `Golden pattern processing failed: ${error}`
        )),
        TE.map((result) => ({
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }))
      );
    }
  );
}

/**
 * 単一思考法実行ハンドラー（自己修復機能付き）
 */
function handleProcessSingleMethodTaskEither(args: unknown): TaskEither<McpError, unknown> {
  return executeWithSelfHealing(
    TOOL_NAMES.PROCESS_SINGLE_METHOD,
    args,
    ProcessSingleMethodInputSchema,
    (parsed) => {
      const typedParsed = parsed as { method: ThinkingMethodType; input: Record<string, unknown>; llmProvider?: string; userId?: string };
      logger.info(LOG_MESSAGES.SINGLE_METHOD_INPUT_PARSED, { parsed: typedParsed });
      
      const context = {
        llmProvider: toLanguageModel(getProvider()),
        llmIntegration: { generateStructuredOutput, generateText, healthCheck },
        userId: typedParsed.userId || 'mcp-user',
        sessionId: `${SESSION_PREFIXES.METHOD}-${Date.now()}`,
      };

      return pipe(
        processSingleMethodTaskEither(
          typedParsed.method,
          typedParsed.input,
          context
        ),
        TE.map((result) => {
          logger.info(LOG_MESSAGES.SINGLE_METHOD_PROCESSING_COMPLETED, { result });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }),
        TE.mapLeft((error) => new McpError(
          ErrorCode.InternalError,
          `Single method processing failed: ${error}`
        ))
      );
    }
  );
}

/**
 * カスタム戦略実行ハンドラー（自己修復機能付き）
 */
function handleProcessCustomStrategyTaskEither(args: unknown): TaskEither<McpError, unknown> {
  return executeWithSelfHealing(
    TOOL_NAMES.PROCESS_CUSTOM_STRATEGY,
    args,
    ProcessCustomStrategyInputSchema,
    (parsed) => {
      const typedParsed = parsed as { primary: ThinkingMethodType; secondary: ThinkingMethodType[]; sequence: ThinkingMethodType[]; input: Record<string, unknown>; llmProvider?: string; userId?: string };
      logger.info(LOG_MESSAGES.CUSTOM_STRATEGY_INPUT_PARSED, { parsed: typedParsed });
      
      const context = {
        llmProvider: toLanguageModel(getProvider()),
        llmIntegration: { generateStructuredOutput, generateText, healthCheck },
        userId: typedParsed.userId || 'mcp-user',
        sessionId: `${SESSION_PREFIXES.STRATEGY}-${Date.now()}`,
      };

      return pipe(
        TE.tryCatch(
          () => processCustomStrategy(
            {
              primary: typedParsed.primary,
              secondary: typedParsed.secondary,
              sequence: typedParsed.sequence
            },
            typedParsed.input,
            context
          ),
          (error) => new McpError(
            ErrorCode.InternalError,
            `Custom strategy processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
        ),
        TE.map((result) => {
          logger.info(LOG_MESSAGES.CUSTOM_STRATEGY_PROCESSING_COMPLETED, { result });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        })
      );
    }
  );
}

/**
 * 思考法一覧取得ハンドラー（TaskEither版）
 */
function handleListThinkingMethodsTaskEither(): TaskEither<McpError, unknown> {
  return TE.right({
    content: [
      {
        type: 'text',
        text: JSON.stringify(getThinkingMethodsList(), null, 2),
      },
    ],
  });
}

/**
 * 局面別推奨思考法取得ハンドラー（TaskEither版）
 */
function handleGetPhaseRecommendationsTaskEither(args: unknown): TaskEither<McpError, unknown> {
  return pipe(
    // 1. 入力検証
    E.tryCatch(
      () => PhaseRecommendationsInputSchema.parse(args),
      (error) => new McpError(
        ErrorCode.InvalidParams,
        `Phase recommendations input validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    ),
    TE.fromEither,
    // 2. 推奨情報の取得
    TE.map(({ phase }: { phase: DevelopmentPhase }) => {
      const recommendations = getPhaseRecommendations();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(recommendations[phase], null, 2),
          },
        ],
      };
    })
  );
}
