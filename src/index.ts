import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import winston from "winston";

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Map to store API keys by session ID
const apiKeys: { [sessionId: string]: string } = {};

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
  // Log incoming headers from MCP client
  logger.info('Received MCP request', {
    headers: req.headers,
    sessionId: req.headers['mcp-session-id'],
    nuclinoApiKey: req.headers['nuclino-api-key'] ? '[REDACTED]' : undefined,
    userAgent: req.headers['user-agent']
  });
  
  // Check for existing session ID
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
    
    // Store API key for existing session
    const nuclinoApiKey = req.headers['nuclino-api-key'] as string;
    if (nuclinoApiKey) {
      apiKeys[sessionId] = nuclinoApiKey;
    }
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports[sessionId] = transport;
      },
      // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
      // locally, make sure to set:
      // enableDnsRebindingProtection: true,
      // allowedHosts: ['127.0.0.1'],
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
        delete apiKeys[transport.sessionId];
      }
    };
    const server = new McpServer({
      name: "example-server",
      version: "1.0.0"
    });

    // Set up echo tool
    server.tool("echo", "Echo tool that prefixes input with 'you are a '", {
      text: z.string().describe("Text to echo")
    }, async (args) => {
      return {
        content: [
          {
            type: "text",
            text: `you are a ${args.text}`
          }
        ]
      };
    });

    // Set up search tool
    server.tool("search", "Search Nuclino for matching content", {
      query: z.string().describe("The search query to find matching content"),
      workspaceId: z.string().optional().describe("Filter items that belong to the given workspace"),
      objectType: z.enum(["item", "collection"]).optional().default("item").describe("Type of object to search for"),
      after: z.string().optional().describe("Only return items after the given ID for pagination")
    }, async (args) => {
      // Get API key from stored session data
      const apiKey = apiKeys[transport.sessionId || ''];
      
      if (!apiKey) {
        return {
          content: [
            {
              type: "text",
              text: "Error: Nuclino API key is required. Please provide it in the 'nuclino-api-key' header."
            }
          ]
        };
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('search', args.query);
      if (args.workspaceId) {
        params.append('workspaceId', args.workspaceId);
      }
      if (args.objectType) {
        params.append('object', args.objectType);
      }
      if (args.after) {
        params.append('after', args.after);
      }

      try {
        const requestHeaders =  {
          'Authorization': `${apiKey}`,
          'Content-Type': 'application/json'
        };
        
        logger.info('Making Nuclino API request', {
          url: `https://api.nuclino.com/v0/items?${params.toString()}`,
          method: 'GET',
          sessionId: transport.sessionId
        });
        
        const response = await fetch(`https://api.nuclino.com/v0/items?${params.toString()}`, {
          method: 'GET',
          headers: requestHeaders
        });

        logger.info('Received Nuclino API response', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          sessionId: transport.sessionId
        });
        
        if (!response.ok) {
          return {
            content: [
              {
                type: "text",
                text: `Error: Nuclino API request failed with status ${response.status}: ${response.statusText}`
              }
            ]
          };
        }

        const data = await response.json();
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: Failed to search Nuclino: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });

    // Connect to the MCP server
    await server.connect(transport);
  } else {
    // Invalid request
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  // Store API key for this session BEFORE handling the request
  const nuclinoApiKey = req.headers['nuclino-api-key'] as string;
  if (nuclinoApiKey && transport.sessionId) {
    apiKeys[transport.sessionId] = nuclinoApiKey;
  }

  // Handle the request
  await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

app.listen(3000);