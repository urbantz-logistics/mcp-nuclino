# Nuclino MCP Server

A Model Context Protocol (MCP) server that provides access to Nuclino content through structured search and retrieval tools.

## Features

- Search Nuclino content by team or workspace
- Retrieve specific items by ID
- Get team and workspace information
- Find teams and workspaces by name
- Rate limiting and retry logic for API reliability
- Support for both HTTP and stdio transports

## Transport Types

This server supports two transport types:

### HTTP Transport (Default)
- Best for web applications and remote access
- Supports multiple concurrent sessions
- Requires API key to be sent in headers for each request
- Runs on port 3000 by default

### Stdio Transport
- Best for local development and CLI tools
- Single session per server instance
- Requires API key to be set as environment variable
- Communicates over stdin/stdout

## Installation

```bash
npm install
```

## Configuration

### Environment Variables

- `TRANSPORT_TYPE`: Set to 'http' (default) or 'stdio'
- `PORT`: Port for HTTP transport (default: 3000)
- `NUCLINO_API_KEY`: Required for stdio transport

## Usage

### HTTP Transport

1. Start the server:
```bash
npm run dev  # Development
npm run start  # Production
```

2. Connect to the server at `http://localhost:3000/mcp`

3. Include your Nuclino API key in the `nuclino-api-key` header with each request.

### Stdio Transport

1. Set your API key:
```bash
export NUCLINO_API_KEY="your_api_key_here"
```

2. Start the server:
```bash
npm run dev:stdio  # Development
npm run start:stdio  # Production
```

The server will communicate via stdin/stdout, making it suitable for direct integration with MCP clients.

## API Key

You need a Nuclino API key to use this server. You can obtain one from your Nuclino workspace settings.

## Available Tools

- `search_by_team`: Search content within a specific team
- `search_by_workspace`: Search content within a specific workspace
- `get_teams`: Get all available teams
- `get_workspaces`: Get all available workspaces
- `find_team_by_name`: Find a team by name
- `find_workspace_by_name`: Find a workspace by name
- `get_item`: Get a specific item by ID

## Development

### Building

```bash
npm run build
```

### Running in Development

```bash
# HTTP transport
npm run dev

# Stdio transport
npm run dev:stdio
```

### Docker

```bash
# Build image
docker build -t nuclino-mcp-server .

# Run HTTP server
docker run -d -p 3000:3000 --name nuclino-mcp-server nuclino-mcp-server

# Run stdio server
docker run -e TRANSPORT_TYPE=stdio -e NUCLINO_API_KEY=your_key nuclino-mcp-server
```

## Architecture

The server follows Clean Architecture principles:

- **Domain Layer**: Entities and repository interfaces
- **Application Layer**: Use cases and business logic
- **Infrastructure Layer**: External integrations (Nuclino API, transports)
- **Presentation Layer**: MCP server implementation

### Transport Layer

The transport layer is abstracted to support multiple transport types:

- `ITransport`: Common interface for all transports
- `HttpTransport`: HTTP-based transport with session management
- `StdioTransport`: Stdio-based transport for local usage
- `TransportFactory`: Factory for creating transport instances

## Error Handling

The server includes comprehensive error handling:

- Rate limiting with exponential backoff
- Retry logic for transient failures
- Graceful shutdown handling
- Detailed logging for debugging