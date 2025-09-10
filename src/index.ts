/**
 * @53able/conflux - Multi-agent thinking methodology tools
 * 
 * Type-safe multi-agent thinking methodology tools for strategic analysis and decision-making
 */

// Core exports
export { ThinkingOrchestrator } from './orchestrator/thinking-orchestrator.js';
export { LLMIntegration } from './core/llm-provider.js';

// Agent exports
export { AbductionAgent } from './agents/abduction-agent.js';
export { LogicalThinkingAgent } from './agents/logical-agent.js';
export { CriticalThinkingAgent } from './agents/critical-agent.js';
export { MECEAgent } from './agents/mece-agent.js';
export { DeductiveThinkingAgent } from './agents/deductive-agent.js';
export { InductiveThinkingAgent } from './agents/inductive-agent.js';
export { PACThinkingAgent } from './agents/pac-agent.js';
export { MetaThinkingAgent } from './agents/meta-agent.js';
export { DebateThinkingAgent } from './agents/debate-agent.js';

// Schema exports
export {
  type ThinkingMethodType,
  type DevelopmentPhase,
  type ThinkingProcessStatus,
  type ThinkingResult,
  type IntegratedThinkingResult,
  type CriticalInput,
  type CriticalOutput,
  type LogicalInput,
  type LogicalOutput,
  type AbductionInput,
  type AbductionOutput,
  type DeductiveInput,
  type DeductiveOutput,
  type InductiveInput,
  type InductiveOutput,
  type MECEInput,
  type MECEOutput,
  type PACInput,
  type PACOutput,
  type MetaInput,
  type MetaOutput,
  type DebateInput,
  type DebateOutput,
} from './schemas/thinking.js';

// Base agent export
export { BaseThinkingAgent, LLMPromptTemplate, type AgentCapability, type AgentContext } from './core/agent-base.js';

// LLM provider exports
export { LLMProviderManager, globalLLMManager, initializeDefaultProviders } from './core/llm-provider.js';
export type { LLMProviderType, LLMProviderConfig } from './core/llm-provider.js';

// MCP server export
export { ThinkingMethodsMCPServer } from './mcp/server.js';
