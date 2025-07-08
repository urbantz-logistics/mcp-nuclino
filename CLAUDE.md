# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Model Context Protocol (MCP) server that provides access to Nuclino content through structured search and retrieval tools. It supports both HTTP and stdio transports and follows Clean Architecture principles.

## Development Commands

- `npm install` - Install dependencies
- `npm run build` - Build TypeScript to JavaScript
- `npm run dev` - Run HTTP server in development mode
- `npm run dev:stdio` - Run stdio server in development mode
- `npm run start` - Start the production HTTP server
- `npm run start:stdio` - Start the production stdio server
- `npm run clean` - Clean build artifacts

## Docker Commands

- `docker build -t nuclino-mcp-server .` - Build Docker image
- `docker run -d -p 3000:3000 --name nuclino-mcp-test nuclino-mcp-server` - Run HTTP container
- `docker run -e TRANSPORT_TYPE=stdio -e NUCLINO_API_KEY=your_key nuclino-mcp-server` - Run stdio container
- `docker-compose up -d` - Run with docker-compose
- `docker logs nuclino-mcp-test` - View container logs

## Architecture

The server follows Clean Architecture principles with these layers:

- **Domain Layer**: Entities and repository interfaces (`src/domain/`)
- **Application Layer**: Use cases and business logic (`src/application/`)
- **Infrastructure Layer**: External integrations and transports (`src/infrastructure/`)
- **Presentation Layer**: MCP server implementation (`src/presentation/`)

### Transport Layer

The transport layer is abstracted to support multiple transport types:
- `ITransport`: Common interface for all transports
- `HttpTransport`: HTTP-based transport with session management
- `StdioTransport`: Stdio-based transport for local usage
- `TransportFactory`: Factory for creating transport instances

## Available Tools

- `search_by_team`: Search content within a specific team
- `search_by_workspace`: Search content within a specific workspace
- `get_teams`: Get all available teams
- `get_workspaces`: Get all available workspaces
- `find_team_by_name`: Find a team by name
- `find_workspace_by_name`: Find a workspace by name
- `get_item`: Get a specific item by ID

## Configuration

Set these environment variables:
- `TRANSPORT_TYPE`: 'http' or 'stdio' (default: 'http')
- `PORT`: Port for HTTP transport (default: 3000)
- `NUCLINO_API_KEY`: Required for stdio transport

## Testing

No specific test framework is configured. Use the examples in `examples/usage-examples.md` for manual testing.

## Deployment

The server is containerized and can be deployed to any Docker-compatible environment. The container exposes port 3000 for HTTP transport or can run in stdio mode for local MCP client integration.