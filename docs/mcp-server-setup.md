# MCP Server Setup and Configuration

This document provides instructions on how to set up and configure the MCP server for the Conflux project.

**バージョン**: 0.2.0  
**パッケージ名**: @53able/conflux

## Prerequisites

- Docker 20.10+ and Docker Compose 2.0+ installed on your machine
- Node.js 20+ and pnpm (for local development)
- TypeScript 5.6+ (for development)

## Setup Methods

### Method 1: Docker (Recommended for Production)

#### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/53able/conflux.git
cd conflux

# Create environment file
cat > .env.docker << 'EOF'
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
DEFAULT_LLM_PROVIDER=openai
NODE_ENV=production
AI_SDK_DISABLE_TELEMETRY=true
AI_SDK_VERCEL_AI_GATEWAY_DISABLED=true
EOF

# Build and run with Docker Compose
docker compose --env-file .env.docker up --build
```

#### Docker Commands

```bash
# Build the Docker image
docker build -t conflux-mcp .

# Run with environment variables
docker run -it --rm \
  -e OPENAI_API_KEY=your_api_key \
  -e DEFAULT_LLM_PROVIDER=openai \
  conflux-mcp

# Run in background
docker compose --env-file .env.docker up -d --build
```

### Method 2: Local Development

#### Prerequisites
- Node.js 20+
- pnpm

#### Setup Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/53able/conflux.git
   cd conflux
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Build the Project**
   ```bash
   pnpm run build
   ```

4. **Set Environment Variables**
   ```bash
   # Create .env file
   echo "OPENAI_API_KEY=your_key_here" > .env
   echo "DEFAULT_LLM_PROVIDER=openai" >> .env
   ```

5. **Run the MCP Server**
   ```bash
   # Using npm script
   pnpm run mcp-server
   
   # Or using tsx directly
   npx tsx src/mcp/server.ts
   
   # Or using npx (if published)
   npx @53able/conflux server
   ```

## MCP Server Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Recommended | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | Recommended | - |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google API key | Optional | - |
| `DEFAULT_LLM_PROVIDER` | Default LLM provider | Optional | `openai` |
| `NODE_ENV` | Environment | Optional | `production` |
| `AI_SDK_DISABLE_TELEMETRY` | Disable telemetry | Recommended | `true` |
| `AI_SDK_VERCEL_AI_GATEWAY_DISABLED` | Disable Vercel AI Gateway | Recommended | `true` |
| `LOG_LEVEL` | Log level | Optional | `info` |

### MCP Server Features

- **stdio通信**: MCPサーバーはstdioベースで動作（ポート不要）
- **自動復旧**: LLMレスポンスのスキーマ不一致時の自動修正
- **ログ機能**: Winstonによる構造化ログ出力
- **エラーハンドリング**: 包括的なエラー処理とログ記録
- **AI SDK v5統合**: 最新のAI SDKとの完全統合
- **型安全性**: TypeScript + Zodスキーマによる完全な型安全性

## Integration with AI Tools

### Cursor Configuration

Add to your `mcp.json`:

```json
{
  "mcp.servers": {
    "thinking-agents": {
      "command": "npx",
      "args": ["@53able/conflux", "server"],
      "env": {
        "OPENAI_API_KEY": "your_openai_api_key_here",
        "DEFAULT_LLM_PROVIDER": "openai"
      }
    }
  }
}
```

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "thinking-agents": {
      "command": "npx",
      "args": ["@53able/conflux", "server"],
      "env": {
        "OPENAI_API_KEY": "your_openai_api_key_here",
        "DEFAULT_LLM_PROVIDER": "openai"
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **MCP Server Not Starting**
   ```bash
   # Check logs
   docker compose logs mcp-server
   
   # Check environment variables
   docker compose --env-file .env.docker config
   ```

2. **API Key Issues**
   ```bash
   # Verify environment variables are set
   echo $OPENAI_API_KEY
   
   # Test with a simple command
   npx @53able/conflux list
   ```

3. **Docker Build Issues**
   ```bash
   # Clear Docker cache and rebuild
   docker compose build --no-cache
   
   # Check Dockerfile syntax
   docker build -t conflux-mcp . --no-cache
   ```

### Logs and Debugging

```bash
# View real-time logs
docker compose logs -f mcp-server

# Check container status
docker ps

# Access container shell
docker exec -it conflux-mcp-server-1 sh
```

## Stopping the Server

```bash
# Stop Docker Compose
docker compose down

# Stop specific container
docker stop conflux-mcp-server-1

# Remove containers and volumes
docker compose down -v
```

## Advanced Configuration

### Custom Docker Compose

Create `docker-compose.override.yml` for custom settings:

```yaml
version: '3.8'
services:
  mcp-server:
    environment:
      - CUSTOM_SETTING=value
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

### Development Mode

For development with hot reload:

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  mcp-server:
    volumes:
      - .:/app
    command: ["pnpm", "run", "mcp-server"]
    environment:
      - NODE_ENV=development
```

Run with: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up`

