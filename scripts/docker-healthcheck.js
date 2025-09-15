#!/usr/bin/env node

/**
 * Docker用ヘルスチェックスクリプト
 * MCPサーバーの健全性を確認します
 */

const { spawn } = require('child_process');
const path = require('path');

const MCP_SERVER_PATH = path.join(__dirname, '..', 'dist', 'mcp', 'server.js');

/**
 * MCPサーバーのヘルスチェック
 */
function checkMCPServerHealth() {
  return new Promise((resolve) => {
    const server = spawn('node', [MCP_SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000
    });

    let output = '';
    let errorOutput = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    server.on('close', (code) => {
      if (code === 0 || output.includes('MCP server started')) {
        resolve(true);
      } else {
        console.error('MCP server health check failed:', errorOutput);
        resolve(false);
      }
    });

    server.on('error', (error) => {
      console.error('MCP server health check error:', error.message);
      resolve(false);
    });

    // 5秒後にタイムアウト
    setTimeout(() => {
      server.kill();
      resolve(false);
    }, 5000);
  });
}

/**
 * メイン実行
 */
async function main() {
  try {
    const isHealthy = await checkMCPServerHealth();
    process.exit(isHealthy ? 0 : 1);
  } catch (error) {
    console.error('Health check failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkMCPServerHealth };
