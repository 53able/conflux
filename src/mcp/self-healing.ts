import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { type TaskEither, generateStructuredOutput, getLogger } from '../core/index.js';
import * as E from 'fp-ts/lib/Either.js';
import * as TE from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { LOG_MESSAGES } from './constants.js';

const logger = getLogger();

/**
 * エラー分類の型定義
 */
export type ErrorType = 'validation' | 'llm_processing' | 'system' | 'unknown';

/**
 * 修復可能なエラーかどうかを判定
 */
export function isRepairableError(error: unknown): boolean {
  if (error instanceof z.ZodError) {
    return true; // バリデーションエラーは修復可能
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // 入力データ構造に関するエラーは修復可能
    return message.includes('validation') || 
           message.includes('invalid') || 
           message.includes('required') ||
           message.includes('expected') ||
           message.includes('schema');
  }
  
  return false;
}

/**
 * エラータイプを分類
 */
export function classifyError(error: unknown): ErrorType {
  if (error instanceof z.ZodError) {
    return 'validation';
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('llm') || message.includes('generation')) {
      return 'llm_processing';
    }
    if (message.includes('system') || message.includes('internal')) {
      return 'system';
    }
  }
  
  return 'unknown';
}

/**
 * データ修復用のスキーマ定義
 */
const DataRepairSchema = z.object({
  repairedData: z.record(z.string(), z.unknown()),
  repairNotes: z.string(),
  confidence: z.number().min(0).max(1)
});

/**
 * 入力データの自動修復
 */
export function repairInputData(
  originalData: unknown,
  targetSchema: z.ZodSchema,
  error: unknown,
  toolName: string
): TaskEither<McpError, unknown> {
  // 1. エラーが修復可能かチェック
  if (!isRepairableError(error)) {
    return TE.left(new McpError(
      ErrorCode.InternalError,
      `Error is not repairable: ${error instanceof Error ? error.message : 'Unknown error'}`
    ));
  }

  // 2. LLMでデータ修復を実行
  return pipe(
    TE.right(undefined),
    TE.chain(() => {
      const errorType = classifyError(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.info(LOG_MESSAGES.DATA_REPAIR_ATTEMPTED, {
        toolName,
        errorType,
        errorMessage,
        originalData
      });

      const systemPrompt = createRepairSystemPrompt(targetSchema, toolName, errorType);
      const userPrompt = createRepairUserPrompt(originalData, errorMessage);

      return TE.tryCatch(
      
        async () => {
          const repairResult = await generateStructuredOutput(
            DataRepairSchema,
            systemPrompt,
            userPrompt,
            undefined,
            {
              temperature: 0.1,
              maxRetries: 2,
              enableAutoRecovery: true
            }
          ) as z.infer<typeof DataRepairSchema>;
          
          logger.info(LOG_MESSAGES.DATA_REPAIR_SUCCESS, {
            repairNotes: repairResult.repairNotes,
            confidence: repairResult.confidence
          });
          
          return repairResult.repairedData;
        },
        (error) => new McpError(
          ErrorCode.InternalError,
          `Data repair failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
      );
    }),
    // 3. 修復されたデータを再検証
    TE.chain((repairedData) => {
      return pipe(
        E.tryCatch(
          () => targetSchema.parse(repairedData),
          (validationError) => new McpError(
            ErrorCode.InternalError,
            `Repaired data validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`
          )
        ),
        TE.fromEither
      );
    })
  );
}

/**
 * 修復用システムプロンプトの生成
 */
function createRepairSystemPrompt(
  targetSchema: z.ZodSchema,
  toolName: string,
  errorType: ErrorType
): string {
  const schemaDescription = extractSchemaDescription(targetSchema);
  
  return `あなたは入力データの修復専門AIです。以下の要件に従って、不正な入力データを正しい形式に修正してください。

## 修復対象
- ツール名: ${toolName}
- エラータイプ: ${errorType}
- 期待されるスキーマ: ${schemaDescription}

## 修復ルール
1. 元のデータの意図を可能な限り保持する
2. 不足している必須フィールドは合理的なデフォルト値で補完する
3. 型が間違っている場合は適切な型に変換する
4. 不正な値は最も近い有効な値に修正する
5. 修復の理由と信頼度を記録する

## 出力形式
- repairedData: 修復されたデータ（元のスキーマに適合）
- repairNotes: 修復内容の詳細説明
- confidence: 修復の信頼度（0.0-1.0）

修復が不可能な場合は、エラーメッセージで理由を説明してください。`;
}

/**
 * 修復用ユーザープロンプトの生成
 */
function createRepairUserPrompt(originalData: unknown, errorMessage: string): string {
  return `以下の入力データを修復してください：

## 元のデータ
\`\`\`json
${JSON.stringify(originalData, null, 2)}
\`\`\`

## エラーメッセージ
${errorMessage}

上記のデータを正しい形式に修正し、修復内容を説明してください。`;
}

/**
 * スキーマの説明を抽出
 */
function extractSchemaDescription(schema: z.ZodSchema): string {
  return E.fold(
    () => 'Unknown schema structure',
    (result: string) => result
  )(
    E.tryCatch(
      () => {
        // Zodスキーマの内部構造から説明を抽出（型安全）
        const schemaWithDef = schema as { 
          _def?: { 
            description?: string;
            typeName?: string;
            shape?: () => Record<string, unknown>;
          } 
        };
        
        if (schemaWithDef._def?.description) {
          return schemaWithDef._def.description;
        }
        
        // オブジェクトスキーマの場合、フィールド情報を抽出
        if (schemaWithDef._def?.typeName === 'ZodObject') {
          const shape = schemaWithDef._def.shape?.();
          if (shape) {
            const fields = Object.keys(shape).map(key => {
              const fieldSchema = shape[key] as { 
                _def?: { typeName?: string };
                isOptional?: () => boolean;
              };
              const fieldType = fieldSchema._def?.typeName || 'unknown';
              const isRequired = fieldSchema.isOptional ? !fieldSchema.isOptional() : true;
              return `${key}: ${fieldType}${isRequired ? ' (required)' : ' (optional)'}`;
            });
            return `Object with fields: ${fields.join(', ')}`;
          }
        }
        
        return 'Unknown schema structure';
      },
      () => 'Unknown schema structure'
    )
  );
}

/**
 * 自己修復機能付きのツール実行
 */
export function executeWithSelfHealing<T>(
  toolName: string,
  args: unknown,
  targetSchema: z.ZodSchema,
  executeFunction: (parsedArgs: T) => TaskEither<McpError, unknown>
): TaskEither<McpError, unknown> {
  return pipe(
    // 1. 初回実行
    E.tryCatch(
      () => targetSchema.parse(args),
      (error) => error
    ),
    E.fold(
      // 2. バリデーションエラーの場合、修復を試行
      (validationError) => {
        logger.warn(LOG_MESSAGES.VALIDATION_ERROR_DETECTED, {
          toolName,
          error: validationError instanceof Error ? validationError.message : 'Unknown error'
        });
        
        return pipe(
          repairInputData(args, targetSchema, validationError, toolName),
          TE.chain((repairedData) => {
            logger.info(LOG_MESSAGES.SELF_HEALING_ACTIVATED, { toolName });
            return executeFunction(repairedData as T);
          })
        );
      },
      // 3. バリデーション成功の場合、直接実行
      (parsedArgs) => {
        logger.info('Initial validation successful, executing tool', { toolName });
        return executeFunction(parsedArgs as T);
      }
    )
  );
}
