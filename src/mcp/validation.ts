import { z } from 'zod';
import { type ValidationResult, type ValidationError } from '../core/index.js';
import * as E from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { ProcessPhaseInputSchema } from './schemas.js';

/**
 * 引数の基本検証
 */
export function validateArguments(args: unknown): E.Either<McpError, Record<string, unknown>> {
  if (!args || typeof args !== 'object') {
    return E.left(new McpError(
      ErrorCode.InvalidParams,
      'Invalid input provided: arguments must be an object'
    ));
  }
  
  return E.right(args as Record<string, unknown>);
}

/**
 * 局面別思考プロセス入力のバリデーション（Validation型を使用）
 */
export function validatePhaseInput(args: unknown): ValidationResult<z.infer<typeof ProcessPhaseInputSchema>> {
  return pipe(
    E.tryCatch(
      () => ProcessPhaseInputSchema.parse(args),
      (error) => {
        if (error instanceof z.ZodError) {
          const validationErrors: ValidationError[] = error.issues.map((err: z.ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message,
            value: (err as unknown as Record<string, unknown>).input
          }));
          return validationErrors;
        }
        return [{
          field: 'unknown',
          message: 'Unknown validation error',
          value: args
        }];
      }
    ),
    E.fold(
      (errors) => E.left(errors),
      (parsed) => E.right(parsed)
    )
  );
}

/**
 * バリデーションエラーをMCPエラーに変換
 */
export function validationErrorToMcpError(validationError: ValidationError): McpError {
  return new McpError(
    ErrorCode.InvalidParams,
    `Validation error in field '${validationError.field}': ${validationError.message}`
  );
}

/**
 * 一般的なエラーをMCPエラーに変換
 */
export function errorToMcpError(error: unknown): McpError {
  if (error instanceof McpError) {
    return error;
  }
  
  const message = error instanceof Error ? error.message : 'Unknown error';
  return new McpError(
    ErrorCode.InternalError,
    `Tool execution failed: ${message}`
  );
}
