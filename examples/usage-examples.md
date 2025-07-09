# Usage Examples

## HTTP Transport Example

### Starting the Server
```bash
# Development
npm run dev

# Production
npm run build && npm run start
```

### Client Configuration
When connecting to the HTTP server, include these headers:
```
POST /mcp HTTP/1.1
Host: localhost:3000
Content-Type: application/json
nuclino-api-key: your_api_key_here
```

## Stdio Transport Example

### Starting the Server
```bash
# Set API key
export NUCLINO_API_KEY="your_api_key_here"

# Development
npm run dev:stdio

# Production
npm run build && npm run start:stdio
```

### MCP Client Configuration
For MCP clients like Claude Desktop, you can add this to your configuration:

```json
{
  "nuclino": {
    "command": "node",
    "args": ["path/to/nuclino-mcp/dist/index.js"],
    "env": {
      "TRANSPORT_TYPE": "stdio",
      "NUCLINO_API_KEY": "your_api_key_here"
    }
  }
}
```

## Environment Variables

- `TRANSPORT_TYPE`: 'http' or 'stdio' (default: 'http')
- `PORT`: Port for HTTP transport (default: 3000)
- `NUCLINO_API_KEY`: Required for stdio transport

## Example Tool Usage

### Search by Team
```json
{
  "tool": "search_by_team",
  "arguments": {
    "query": "dynamic release",
    "teamId": "3d0d1122-57f8-4086-9b78-96acf9b9ba39"
  }
}
```

### Get Item by ID
```json
{
  "tool": "get_item",
  "arguments": {
    "itemId": "8e2ac350-8df4-488b-b961-cb9347e21c71"
  }
}
```