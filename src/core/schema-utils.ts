import { z } from 'zod';
import { type ValidationResult, type ValidationError } from './index.js';
import * as E from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import type { ZodSchema, Schema } from './types.js';

/**
 * Zodスキーマかどうかを判定（型安全）
 */
export const isZodSchema = (schema: Schema): schema is ZodSchema => {
  return (
    typeof schema === 'object' && 
    schema !== null && 
    'parse' in schema && 
    typeof (schema as { parse: unknown }).parse === 'function'
  );
};

/**
 * スキーマのバリデーション（Validation型を使用）
 */
export const validateSchema = (schema: ZodSchema, data: unknown): ValidationResult<unknown> => {
  return pipe(
    E.tryCatch(
      () => schema.parse(data),
      (error) => {
        if (error instanceof z.ZodError) {
          const validationErrors: ValidationError[] = error.issues.map((err: z.ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message,
            value: (err as unknown as { input: unknown }).input
          }));
          return validationErrors;
        }
        return [{ field: 'unknown', message: 'Unknown validation error', value: data }];
      }
    ),
    E.fold(
      (errors) => E.left(errors),
      (parsed) => E.right(parsed)
    )
  );
};

/**
 * Zodスキーマの型名を取得（型安全）
 */
export const getZodSchemaTypeName = (schema: ZodSchema): string => {
  // Zodスキーマの内部構造にアクセスする型安全な方法
  const schemaWithDef = schema as { _def?: { typeName?: string } };
  return schemaWithDef._def?.typeName || 'Unknown';
};

/**
 * スキーマからJSON例を生成
 */
export const generateSchemaExample = (schema: ZodSchema): string => {
  try {
    // 基本的な例を生成
    const example = generateExampleFromZodSchema(schema);
    return JSON.stringify(example, null, 2);
  } catch {
    return '{\n  "error": "スキーマ例の生成に失敗しました"\n}';
  }
};

/**
 * スキーマから注意事項を生成
 */
export const generateSchemaInstructions = (schema: ZodSchema): string => {
  try {
    const instructions = extractSchemaInstructions(schema);
    return instructions;
  } catch {
    return '指定されたスキーマ構造に従ってください。';
  }
};

/**
 * スキーマ要件の抽出
 */
export const extractSchemaRequirements = (schema: Schema): string => {
  return pipe(
    E.tryCatch(
      () => {
        if (isZodSchema(schema)) {
          const typeName = getZodSchemaTypeName(schema);
          const exampleJson = generateSchemaExample(schema);
          return `
スキーマタイプ: ${typeName}

出力例（この形式に厳密に従ってください）:
${exampleJson}

詳細な構造要件を満たす必要があります。`;
        }
        return '指定されたスキーマ構造に従ってください。';
      },
      () => '指定されたスキーマ構造に従ってください。'
    ),
    E.fold(
      () => '指定されたスキーマ構造に従ってください。',
      (result) => result
    )
  );
};

/**
 * スキーマから詳細な指示を抽出
 */
const extractSchemaInstructions = (schema: ZodSchema): string => {
  const instructions: string[] = [];
  
  try {
    const schemaString = schema.toString();
    
    // オブジェクトスキーマの場合
    if (schemaString.includes('ZodObject')) {
      // 各フィールドの型に基づいた指示を生成
      if (schemaString.includes('conclusion')) {
        instructions.push('- conclusion: 必ず文字列で出力');
      }
      if (schemaString.includes('reasoning')) {
        instructions.push('- reasoning: 必ず配列または文字列で出力');
      }
      if (schemaString.includes('validity')) {
        instructions.push('- validity: "valid", "invalid", "uncertain"のいずれか');
      }
      if (schemaString.includes('confidence')) {
        instructions.push('- confidence: 0から1の数値');
      }
      if (schemaString.includes('reasoning')) {
        instructions.push('- reasoning: 必ず文字列で出力');
      }
      if (schemaString.includes('status')) {
        instructions.push('- status: "completed"で固定');
      }
      
      // その他の一般的なフィールド
      if (schemaString.includes('generalizations')) {
        instructions.push('- generalizations: 必ずオブジェクトの配列で出力');
      }
      if (schemaString.includes('hypotheses')) {
        instructions.push('- hypotheses: 必ずオブジェクトの配列で出力');
      }
      if (schemaString.includes('evidence')) {
        instructions.push('- evidence: 必ず文字列の配列で出力');
      }
      if (schemaString.includes('categories')) {
        instructions.push('- categories: 必ずオブジェクトの配列で出力');
      }
      if (schemaString.includes('questions')) {
        instructions.push('- questions: 必ず文字列の配列で出力');
      }
    }
    
    // 配列の場合
    if (schemaString.includes('ZodArray')) {
      instructions.push('- 配列フィールドは必ず配列形式で出力');
    }
    
    // 数値の場合
    if (schemaString.includes('ZodNumber')) {
      instructions.push('- 数値フィールドは必ず数値で出力（文字列ではない）');
    }
    
    // 列挙型の場合
    if (schemaString.includes('ZodEnum')) {
      instructions.push('- 列挙型フィールドは指定された値のみを使用');
    }
    
    // オプショナルフィールドの場合
    if (schemaString.includes('ZodOptional')) {
      instructions.push('- オプショナルフィールドは省略可能');
    }
    
    // 共通の注意事項
    instructions.push('- すべての必須フィールドを含める');
    instructions.push('- データ型を正確に指定する');
    instructions.push('- JSONのみを出力し、他のテキストは含めない');
    
    return instructions.length > 0 ? instructions.join('\n') : '指定されたスキーマ構造に従ってください。';
  } catch {
    return '指定されたスキーマ構造に従ってください。';
  }
};

/**
 * Zodスキーマから例を生成（安全なアプローチ）
 */
const generateExampleFromZodSchema = (schema: ZodSchema): unknown => {
  try {
    // スキーマの内部構造を調べて特定のスキーマを識別
    const schemaWithDef = schema as { _def?: { typeName?: string; shape?: (() => Record<string, unknown>) | Record<string, unknown> } };
    
    if (schemaWithDef._def?.typeName === 'ZodObject') {
      const shape = schemaWithDef._def.shape;
      
      // 特定のスキーマに基づいた例を生成
      if (shape && typeof shape === 'function') {
        const shapeObj = shape();
        
        if ('generalizations' in shapeObj && 'sampleSize' in shapeObj) {
        // InductiveOutputSchema
        return {
          generalizations: [
            {
              pattern: "発見されたパターンの説明",
              confidence: 0.8,
              supportingEvidence: ["証拠1", "証拠2"],
              exceptions: ["例外1"]
            },
            {
              pattern: "別のパターンの説明",
              confidence: 0.7,
              supportingEvidence: ["証拠3", "証拠4"]
            }
          ],
          sampleSize: 5,
          biasWarnings: ["サンプルサイズが小さい", "選択バイアスの可能性"],
          confidence: 0.85,
          reasoning: "推論プロセスの説明",
          status: "completed"
        };
        } else if ('conclusion' in shapeObj && 'validityCheck' in shapeObj) {
        // DeductiveOutputSchema
        return {
          conclusion: "導出された結論",
          validityCheck: {
            isValid: true,
            reasoning: "論理の妥当性チェックの理由",
            premiseReliability: 0.9
          },
          implications: ["含意1", "含意2"],
          confidence: 0.8,
          reasoning: "推論の理由",
          status: "completed"
        };
        } else if ('hypotheses' in shapeObj && 'recommendedNext' in shapeObj) {
        // AbductionOutputSchema
        return {
          hypotheses: [
            {
              explanation: "最も可能性の高い説明仮説",
              plausibility: 0.8,
              testablePredicitions: ["予測1", "予測2"]
            }
          ],
          recommendedNext: ["inductive", "deductive"],
          confidence: 0.8,
          reasoning: "仮説選択の理由",
          status: "completed"
        };
        } else if ('questioningResults' in shapeObj && 'strengthsWeaknesses' in shapeObj) {
        // CriticalOutputSchema
        return {
          questioningResults: {
            questionValidity: ["質問1", "質問2"],
            logicalGaps: ["ギャップ1", "ギャップ2"],
            assumptionChallenges: ["挑戦1", "挑戦2"],
            biases: ["バイアス1", "バイアス2"]
          },
          strengthsWeaknesses: {
            strengths: ["強み1", "強み2"],
            weaknesses: ["弱み1", "弱み2"],
            missingEvidence: ["不足証拠1", "不足証拠2"]
          },
          recommendations: ["推奨1", "推奨2"],
          confidence: 0.8,
          reasoning: "評価の理由",
          status: "completed"
        };
        } else if ('proposition' in shapeObj && 'proArguments' in shapeObj) {
        // DebateOutputSchema
        return {
          proposition: "論題",
          proArguments: [
            {
              argument: "賛成論点1",
              evidence: ["証拠1", "証拠2"],
              strength: 0.8
            }
          ],
          conArguments: [
            {
              argument: "反対論点1",
              evidence: ["証拠3", "証拠4"],
              strength: 0.6
            }
          ],
          keyDisputes: ["争点1", "争点2"],
          recommendation: {
            decision: "support",
            reasoning: "判断の理由",
            conditions: ["条件1", "条件2"]
          },
          confidence: 0.8,
          reasoning: "結論の理由",
          status: "completed"
        };
        } else if ('reasoning' in shapeObj && 'pyramid' in shapeObj) {
        // LogicalOutputSchema
        return {
          conclusion: "導出された結論",
          reasoning: [
            {
              step: "推論ステップ1",
              evidence: ["証拠1", "証拠2"],
              inference: "推論内容1"
            }
          ],
          pyramid: {
            conclusion: "ピラミッド構造の結論",
            supports: [
              {
                claim: "支持する主張1",
                evidence: ["根拠1", "根拠2"]
              }
            ]
          },
          confidence: 0.8,
          status: "completed"
        };
        } else if ('categories' in shapeObj && 'gaps' in shapeObj) {
        // MECEOutputSchema
        return {
          criteria: "使用した分類基準",
          categories: [
            {
              name: "カテゴリ名",
              items: ["項目1", "項目2"],
              coverage: "カテゴリの範囲説明"
            }
          ],
          gaps: ["見つかった漏れ"],
          overlaps: ["見つかった重複"],
          completenessScore: 0.8,
          reasoning: "分類の理由",
          status: "completed"
        };
        } else if ('processEvaluation' in shapeObj && 'recommendations' in shapeObj) {
        // MetaOutputSchema
        return {
          processEvaluation: {
            currentProcess: ["プロセス1", "プロセス2"],
            effectiveness: 0.8,
            gaps: ["ギャップ1", "ギャップ2"]
          },
          recommendations: [
            {
              aspect: "改善対象1",
              improvement: "改善提案1",
              priority: "high"
            }
          ],
          alternativeApproaches: ["代替アプローチ1", "代替アプローチ2"],
          confidence: 0.8,
          reasoning: "評価の理由",
          status: "completed"
        };
        } else if ('premise' in shapeObj && 'assumption' in shapeObj && 'assumptions_validity' in shapeObj && 'premise_validity' in shapeObj) {
        // PACOutputSchema
        return {
          premise: "前提",
          assumption: "仮定",
          conclusion: "結論",
          assumptions_validity: {
            isValid: true,
            concerns: ["懸念1", "懸念2"],
            testMethods: ["検証方法1", "検証方法2"]
          },
          premise_validity: {
            isReliable: true,
            biases: ["バイアス1", "バイアス2"],
            verification_needed: ["検証項目1", "検証項目2"]
          },
          confidence: 0.8,
          reasoning: "分解と検証の理由",
          status: "completed"
        };
        } else {
          // 汎用的なオブジェクト例
          return {
            field1: '例文字列',
            field2: 0.5,
            field3: true
          };
        }
      } else {
        // 汎用的なオブジェクト例（shapeが関数でない場合）
        return {
          field1: '例文字列',
          field2: 0.5,
          field3: true
        };
      }
    } else if (schemaWithDef._def?.typeName === 'ZodString') {
      return '例文字列';
    } else if (schemaWithDef._def?.typeName === 'ZodNumber') {
      return 0.5;
    } else if (schemaWithDef._def?.typeName === 'ZodBoolean') {
      return true;
    } else if (schemaWithDef._def?.typeName === 'ZodArray') {
      return ['例1', '例2'];
    } else if (schemaWithDef._def?.typeName === 'ZodEnum') {
      return 'valid';
    } else {
      return '例の値';
    }
  } catch {
    return '例の値';
  }
};

// エクスポート
export { generateExampleFromZodSchema };
