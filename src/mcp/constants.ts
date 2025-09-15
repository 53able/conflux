/**
 * MCPモジュールの定数定義
 * 
 * 共通定数は src/core/constants.ts からインポートし、
 * MCP固有の定数のみをここで定義します。
 */

// 共通定数をインポート
export { 
  MCP_SERVER_CONFIG as SERVER_CONFIG,
  MCP_TOOL_NAMES as TOOL_NAMES,
  SESSION_PREFIXES
} from '../core/constants.js';

/**
 * ログメッセージ
 */
export const LOG_MESSAGES = {
  SERVER_INITIALIZED: 'MCP Server initialized',
  SERVER_STARTED: 'MCP Server started successfully',
  TOOLS_LIST_RETURNED: 'Returning tools list',
  TOOL_REQUEST_RECEIVED: 'Tool request received',
  PHASE_INPUT_PARSED: 'Phase input parsed successfully',
  PHASE_PROCESSING_COMPLETED: 'Phase processing completed',
  SINGLE_METHOD_INPUT_PARSED: 'Single method input parsed successfully',
  SINGLE_METHOD_PROCESSING_COMPLETED: 'Single method processing completed',
  CUSTOM_STRATEGY_INPUT_PARSED: 'Custom strategy input parsed successfully',
  CUSTOM_STRATEGY_PROCESSING_COMPLETED: 'Custom strategy processing completed',
  // 自己修復機能関連
  DATA_REPAIR_ATTEMPTED: 'Data repair attempted',
  DATA_REPAIR_SUCCESS: 'Data repair successful',
  DATA_REPAIR_FAILED: 'Data repair failed',
  SELF_HEALING_ACTIVATED: 'Self-healing mechanism activated',
  VALIDATION_ERROR_DETECTED: 'Validation error detected, attempting repair',
} as const;
