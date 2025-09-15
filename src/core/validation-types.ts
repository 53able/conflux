import * as E from 'fp-ts/lib/Either.js';

/**
 * バリデーションエラーの型定義
 */
export interface ValidationError {
  field: string;
  message: string;
  value: unknown;
}

/**
 * バリデーション結果の型定義
 */
export type ValidationResult<T> = E.Either<ValidationError[], T>;
