/**
 * 関数型エージェントのエクスポート
 * クラスベースのエージェントは削除されました
 */

// 関数型エージェントのインポート
import { inductiveAgent } from './inductive-agent.js';
import { abductionAgent } from './abduction-agent.js';
import { criticalAgent } from './critical-agent.js';
import { meceAgent } from './mece-agent.js';
import { deductiveAgent } from './deductive-agent.js';
import { metaAgent } from './meta-agent.js';
import { pacAgent } from './pac-agent.js';
import { logicalAgent } from './logical-agent.js';
import { debateAgent } from './debate-agent.js';

// 関数型エージェントのマップ
export const FUNCTIONAL_AGENTS = {
  inductive: inductiveAgent,
  abduction: abductionAgent,
  critical: criticalAgent,
  mece: meceAgent,
  deductive: deductiveAgent,
  meta: metaAgent,
  pac: pacAgent,
  logical: logicalAgent,
  debate: debateAgent,
} as const;

// 個別エクスポート
export {
  inductiveAgent,
  abductionAgent,
  criticalAgent,
  meceAgent,
  deductiveAgent,
  metaAgent,
  pacAgent,
  logicalAgent,
  debateAgent,
};

// 型エクスポート
export type { FunctionalAgent } from '../core/agent-base.js';

// スキーマから型を再エクスポート
export type {
  AbductionInput,
  AbductionOutput,
  CriticalInput,
  CriticalOutput,
  DebateInput,
  DebateOutput,
  DeductiveInput,
  DeductiveOutput,
  InductiveInput,
  InductiveOutput,
  LogicalInput,
  LogicalOutput,
  MECEInput,
  MECEOutput,
  MetaInput,
  MetaOutput,
  PACInput,
  PACOutput,
} from '../schemas/index.js';

