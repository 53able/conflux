# MCP Server Setup and Configuration

This document provides instructions on how to set up and configure the MCP server for the Conflux project.

## Prerequisites

- Docker and Docker Compose installed on your machine.
- Node.js and pnpm installed.

## Setup Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-repo/conflux.git
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

4. **Run the MCP Server**
   You can run the MCP server using Docker Compose:
   ```bash
   docker-compose up
   ```

   This will start the MCP server on port 3000 by default.

5. **Environment Configuration**
   You can configure the server using environment variables. Create a `.env` file in the project root:
   ```
   PORT=3000
   NODE_ENV=production
   ```

## Accessing the Server

Once the server is running, you can access it at `http://localhost:3000`.

## Stopping the Server

To stop the server, use:
```bash
docker-compose down
```

## Additional Configuration

For more advanced configurations, you can modify the `docker-compose.yml` and `Dockerfile` as needed.

