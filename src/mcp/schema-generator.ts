/**
 * MCPツール用のスキーマ生成ユーティリティ
 * 思考法固有の入力スキーマを動的に生成します
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { 
  ThinkingMethodType,
  DevelopmentPhase,
  AbductionInputSchema,
  CriticalInputSchema,
  DebateInputSchema,
  DeductiveInputSchema,
  InductiveInputSchema,
  LogicalInputSchema,
  MECEInputSchema,
  MetaInputSchema,
  PACInputSchema
} from '../schemas/index.js';

/**
 * 思考法とそのZodスキーマのマッピング
 */
const THINKING_METHOD_SCHEMAS = {
  abduction: AbductionInputSchema,
  critical: CriticalInputSchema,
  debate: DebateInputSchema,
  deductive: DeductiveInputSchema,
  inductive: InductiveInputSchema,
  logical: LogicalInputSchema,
  mece: MECEInputSchema,
  meta: MetaInputSchema,
  pac: PACInputSchema,
} as const;

/**
 * 思考法固有の入力スキーマをJSON Schema形式で生成
 */
export function generateThinkingMethodInputSchemas(): Record<string, unknown>[] {
  return Object.entries(THINKING_METHOD_SCHEMAS).map(([_methodName, zodSchema]) => {
    return zodToJsonSchema(zodSchema);
  });
}

/**
 * 思考法固有の入力スキーマのユニオン型を生成
 */
export function generateInputSchemaUnion(): Record<string, unknown> {
  const methodSchemas = generateThinkingMethodInputSchemas();
  
  return {
    oneOf: [
      ...methodSchemas,
      {
        type: 'object',
        description: '任意のオブジェクト（上記のいずれにも該当しない場合）'
      }
    ],
    description: '分析対象の入力データ（思考法固有の構造または任意のオブジェクト）'
  };
}

/**
 * 特定の思考法の入力スキーマを取得
 */
export function getThinkingMethodInputSchema(method: ThinkingMethodType): Record<string, unknown> {
  const zodSchema = THINKING_METHOD_SCHEMAS[method];
  if (!zodSchema) {
    throw new Error(`Unknown thinking method: ${method}`);
  }
  
  return zodToJsonSchema(zodSchema);
}

/**
 * 開発局面の列挙値を取得
 */
export function getDevelopmentPhaseEnum(): string[] {
  // Zodスキーマから動的に列挙値を取得
  const phaseSchema = zodToJsonSchema(DevelopmentPhase) as Record<string, unknown>;
  if ('enum' in phaseSchema && Array.isArray(phaseSchema.enum)) {
    return phaseSchema.enum as string[];
  }
  
  // スキーマから列挙値を取得できない場合は例外を投げる
  throw new Error('Failed to extract enum values from DevelopmentPhase schema');
}

/**
 * 思考法の列挙値を取得
 */
export function getThinkingMethodEnum(): string[] {
  // Zodスキーマから動的に列挙値を取得
  const methodSchema = zodToJsonSchema(ThinkingMethodType) as Record<string, unknown>;
  if ('enum' in methodSchema && Array.isArray(methodSchema.enum)) {
    return methodSchema.enum as string[];
  }
  
  // スキーマから列挙値を取得できない場合は例外を投げる
  throw new Error('Failed to extract enum values from ThinkingMethodType schema');
}

/**
 * Zodスキーマから説明文を取得
 */
export function getSchemaDescription(schema: z.ZodSchema): string | undefined {
  // Zodスキーマの内部プロパティから説明文を取得
  const zodSchema = schema as unknown as Record<string, unknown>;
  const def = zodSchema._def as Record<string, unknown> | undefined;
  return (def?.description as string) || (zodSchema.description as string);
}

/**
 * 思考法の説明文を取得
 */
export function getThinkingMethodDescription(method: ThinkingMethodType): string | undefined {
  const zodSchema = THINKING_METHOD_SCHEMAS[method];
  if (!zodSchema) {
    return undefined;
  }
  return getSchemaDescription(zodSchema);
}

/**
 * 基本的な入力スキーマプロパティを生成
 */
export function generateBaseInputProperties(): Record<string, unknown> {
  return {
    llmProvider: {
      type: 'string',
      description: 'LLMプロバイダー設定',
      optional: true
    },
    userId: {
      type: 'string',
      description: 'ユーザーID',
      optional: true
    }
  };
}
