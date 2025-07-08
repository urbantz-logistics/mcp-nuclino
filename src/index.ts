import express from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "./infrastructure/http/Logger.js";
import { NuclinoRepository } from "./infrastructure/nuclino/NuclinoRepository.js";
import { SearchUseCase } from "./application/usecases/SearchUseCase.js";
import { TeamUseCase } from "./application/usecases/TeamUseCase.js";
import { ItemUseCase } from "./application/usecases/ItemUseCase.js";
import { NuclinoMcpServer } from "./presentation/McpServer.js";

const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Map to store API keys by session ID
const apiKeys: { [sessionId: string]: string } = {};

// Map to store repositories by session ID
const repositories: { [sessionId: string]: NuclinoRepository } = {};

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
    
    // Update API key for existing session
    const nuclinoApiKey = req.headers['nuclino-api-key'] as string;
    if (nuclinoApiKey) {
      apiKeys[sessionId] = nuclinoApiKey;
      // Update the repository with the new API key
      if (repositories[sessionId]) {
        repositories[sessionId].updateApiKey(nuclinoApiKey);
      }
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
        delete repositories[transport.sessionId];
      }
    };

    // Get API key from headers
    const nuclinoApiKey = req.headers['nuclino-api-key'] as string;
    if (!nuclinoApiKey) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: Nuclino API key is required',
        },
        id: null,
      });
      return;
    }

    // Create dependencies using Clean Architecture
    const nuclinoRepository = new NuclinoRepository(nuclinoApiKey);
    const searchUseCase = new SearchUseCase(nuclinoRepository);
    const teamUseCase = new TeamUseCase(nuclinoRepository);
    const itemUseCase = new ItemUseCase(nuclinoRepository);

    // Create MCP server with dependencies
    const nuclinoMcpServer = new NuclinoMcpServer(searchUseCase, teamUseCase, itemUseCase);
    const server = nuclinoMcpServer.getServer();

    // Connect to the MCP server
    await server.connect(transport);

    // Store repository for this session
    if (transport.sessionId) {
      repositories[transport.sessionId] = nuclinoRepository;
    }
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

app.listen(3000, () => {
  logger.info('Nuclino MCP server started on port 3000');
});