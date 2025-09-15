/**
 * 入力変換ユーティリティ（Single Source of Truth）
 * 
 * このファイルは、思考法に応じた入力形式変換を一元管理します。
 * 各思考法のスキーマ要件に適合するように入力データを変換する共通ロジックを提供します。
 */

import { THINKING_METHODS, DEVELOPMENT_PHASES } from './constants.js';

// ============================================================================
// 型定義
// ============================================================================

/**
 * 思考法の種類
 */
export type ThinkingMethodType = typeof THINKING_METHODS[number];

/**
 * 開発局面の種類
 */
export type DevelopmentPhase = typeof DEVELOPMENT_PHASES[number];

/**
 * 入力変換の結果
 */
export interface InputConversionResult {
  readonly methodType: ThinkingMethodType;
  readonly convertedInput: Record<string, unknown>;
  readonly originalInput: Record<string, unknown>;
  readonly phase: DevelopmentPhase;
}

// ============================================================================
// 入力変換関数
// ============================================================================

/**
 * 思考法に応じた入力形式変換
 * 各思考法のスキーマ要件に適合するように入力データを変換する
 * 
 * @param methodType 思考法の種類
 * @param input 元の入力データ
 * @param phase 開発局面
 * @returns 変換された入力データ
 */
/**
 * その他の入力フィールドを取得するヘルパー関数
 */
const getOtherInputs = (input: Record<string, unknown>): Record<string, unknown> => {
  const {
    problem: _problem,
    context: _context,
    surprisingFact: _surprisingFact,
    majorPremise: _majorPremise,
    minorPremise: _minorPremise,
    question: _question,
    claim: _claim,
    proposition: _proposition,
    observations: _observations,
    purpose: _purpose,
    items: _items,
    currentThinking: _currentThinking,
    objective: _objective,
    evidence: _evidence,
    constraints: _constraints,
    proposedCriteria: _proposedCriteria,
    topic: _topic,
    positions: _positions,
    ...otherInputs 
  } = input;
  
  return otherInputs;
};

export function convertInputForMethod(
  methodType: ThinkingMethodType,
  input: Record<string, unknown>,
  phase: DevelopmentPhase
): Record<string, unknown> {
  const converterMap: Record<ThinkingMethodType, (input: Record<string, unknown>, phase: DevelopmentPhase) => Record<string, unknown>> = {
    abduction: (input, phase) => ({
      surprisingFact: input.surprisingFact || input.problem || '驚くべき事実',
      context: (input.context as string) || '',
      domain: phase,
      ...getOtherInputs(input),
    }),
    
    deductive: (input, phase) => ({
      majorPremise: input.majorPremise || input.problem || '大前提',
      minorPremise: input.minorPremise || (input.context as string) || '小前提',
      domain: phase,
      ...getOtherInputs(input),
    }),
    
    logical: (input, phase) => ({
      question: input.question || input.problem || '論点を設定してください',
      context: (input.context as string) || '',
      constraints: input.constraints || [],
      domain: phase,
      ...getOtherInputs(input),
    }),
    
    critical: (input, phase) => ({
      claim: input.claim || input.problem || '検証すべき主張',
      evidence: input.evidence || (input.context ? [input.context as string] : []),
      context: (input.context as string) || '',
      domain: phase,
      ...getOtherInputs(input),
    }),
    
    mece: (input, _phase) => ({
      purpose: input.purpose || input.problem || '分類の目的',
      items: input.items || (input.context ? [input.context as string] : []),
      proposedCriteria: input.proposedCriteria || '',
      ...getOtherInputs(input),
    }),
    
    inductive: (input, phase) => ({
      observations: input.observations || (input.context ? [input.context as string] : []),
      context: (input.context as string) || '',
      domain: phase,
      ...getOtherInputs(input),
    }),
    
    meta: (input, _phase) => ({
      currentThinking: input.currentThinking || input.problem || '現在の思考内容',
      objective: input.objective || '目標を設定してください',
      context: (input.context as string) || '',
      ...getOtherInputs(input),
    }),
    
    pac: (input, phase) => ({
      claim: input.claim || input.problem || '検証すべき主張',
      context: (input.context as string) || '',
      domain: phase,
      ...getOtherInputs(input),
    }),
    
    debate: (input, phase) => ({
      topic: input.topic || input.problem || '論題を設定してください',
      positions: input.positions || [],
      context: (input.context as string) || '',
      domain: phase,
      ...getOtherInputs(input),
    }),
  };

  const converter = converterMap[methodType];
  return converter ? converter(input, phase) : input;
}

/**
 * 複数の思考法に対して入力変換を実行
 * 
 * @param methodTypes 思考法の種類の配列
 * @param input 元の入力データ
 * @param phase 開発局面
 * @returns 変換結果の配列
 */
export function convertInputForMethods(
  methodTypes: ThinkingMethodType[],
  input: Record<string, unknown>,
  phase: DevelopmentPhase
): InputConversionResult[] {
  return methodTypes.map(methodType => ({
    methodType,
    convertedInput: convertInputForMethod(methodType, input, phase),
    originalInput: input,
    phase
  }));
}

/**
 * 入力データの正規化
 * 文字列のトリム、配列の正規化などを行う
 * 
 * @param input 元の入力データ
 * @returns 正規化された入力データ
 */
export function normalizeInput(input: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      normalized[key] = value.trim();
    } else if (Array.isArray(value)) {
      normalized[key] = value;
    } else if (value !== null && value !== undefined) {
      normalized[key] = value;
    }
  }
  
  return normalized;
}

/**
 * 入力データの検証
 * 必須フィールドの存在チェックなどを行う
 * 
 * @param input 入力データ
 * @param methodType 思考法の種類
 * @returns 検証結果
 */
export function validateInput(
  input: Record<string, unknown>,
  methodType: ThinkingMethodType
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  switch (methodType) {
    case 'abduction':
      if (!input.surprisingFact) {
        errors.push('surprisingFact is required for abduction method');
      }
      break;
    
    case 'deductive':
      if (!input.majorPremise || !input.minorPremise) {
        errors.push('majorPremise and minorPremise are required for deductive method');
      }
      break;
    
    case 'logical':
      if (!input.question) {
        errors.push('question is required for logical method');
      }
      break;
    
    case 'critical':
      if (!input.claim) {
        errors.push('claim is required for critical method');
      }
      break;
    
    case 'mece':
      if (!input.purpose || !input.items) {
        errors.push('purpose and items are required for mece method');
      }
      break;
    
    case 'inductive':
      if (!input.observations || !Array.isArray(input.observations)) {
        errors.push('observations array is required for inductive method');
      }
      break;
    
    case 'meta':
      if (!input.currentThinking || !input.objective) {
        errors.push('currentThinking and objective are required for meta method');
      }
      break;
    
    case 'pac':
      if (!input.claim) {
        errors.push('claim is required for pac method');
      }
      break;
    
    case 'debate':
      if (!input.topic) {
        errors.push('topic is required for debate method');
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 入力変換の実行（検証付き）
 * 
 * @param methodType 思考法の種類
 * @param input 元の入力データ
 * @param phase 開発局面
 * @returns 変換結果（検証エラーがある場合はエラー情報も含む）
 */
export function convertAndValidateInput(
  methodType: ThinkingMethodType,
  input: Record<string, unknown>,
  phase: DevelopmentPhase
): {
  success: boolean;
  data?: Record<string, unknown>;
  errors?: string[];
} {
  // 入力データを正規化
  const normalizedInput = normalizeInput(input);
  
  // 入力変換を実行
  const convertedInput = convertInputForMethod(methodType, normalizedInput, phase);
  
  // 検証を実行
  const validation = validateInput(convertedInput, methodType);
  
  if (validation.isValid) {
    return {
      success: true,
      data: convertedInput
    };
  } else {
    return {
      success: false,
      errors: validation.errors
    };
  }
}
