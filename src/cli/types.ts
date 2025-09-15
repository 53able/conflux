/**
 * CLI関連の型定義（Zodスキーマファースト）
 */

import { z } from 'zod';
import { DevelopmentPhase, ThinkingMethodType } from '../schemas/index.js';

/**
 * CLIコマンドの種類
 */
export const CLICommand = z.enum([
  'phase',
  'golden', 
  'method',
  'strategy',
  'list',
  'recommend',
  'server',
  'help'
] as const);

export type CLICommand = z.infer<typeof CLICommand>;

/**
 * CLIオプション
 */
export const CLIOptions = z.object({
  verbose: z.boolean().optional().default(false),
  debug: z.boolean().optional().default(false),
});

export type CLIOptions = z.infer<typeof CLIOptions>;

/**
 * 解析されたCLI引数
 */
export const ParsedArguments = z.object({
  command: CLICommand,
  args: z.array(z.string()),
  options: CLIOptions,
});

export type ParsedArguments = z.infer<typeof ParsedArguments>;

/**
 * 局面別引数
 */
export const PhaseArguments = z.object({
  phase: DevelopmentPhase,
  input: z.record(z.string(), z.unknown()),
});

export type PhaseArguments = z.infer<typeof PhaseArguments>;

/**
 * 単一思考法引数
 */
export const MethodArguments = z.object({
  method: ThinkingMethodType,
  input: z.record(z.string(), z.unknown()),
});

export type MethodArguments = z.infer<typeof MethodArguments>;

/**
 * カスタム戦略引数
 */
export const StrategyArguments = z.object({
  strategy: z.object({
    primary: ThinkingMethodType,
    secondary: z.array(ThinkingMethodType),
    sequence: z.array(ThinkingMethodType),
    maxIterations: z.number().optional()
  }),
  input: z.record(z.string(), z.unknown()),
});

export type StrategyArguments = z.infer<typeof StrategyArguments>;

/**
 * 思考法情報
 */
export const ThinkingMethodInfo = z.object({
  name: ThinkingMethodType,
  description: z.string(),
  applicablePhases: z.array(DevelopmentPhase),
});

export type ThinkingMethodInfo = z.infer<typeof ThinkingMethodInfo>;
