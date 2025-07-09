import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { ITransport, TransportConfig } from "./ITransport.js";
import { logger } from "../http/Logger.js";
import { NuclinoRepository } from "../nuclino/NuclinoRepository.js";
import { RateLimiter } from "../nuclino/RateLimiter.js";
import { RetryHandler } from "../nuclino/RetryHandler.js";
import { NuclinoMcpServer } from "../../presentation/McpServer.js";

export class HttpTransport implements ITransport {
  private app: express.Application;
  private server: any;
  private transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
  private apiKeys: { [sessionId: string]: string } = {};
  private repositories: { [sessionId: string]: NuclinoRepository } = {};

  constructor(private config: TransportConfig) {
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
  }

  private setupRoutes() {
    // Handle POST requests for client-to-server communication
    this.app.post('/mcp', async (req, res) => {
      // Log incoming headers from MCP client
      logger.info('Received MCP request', {
        sessionId: req.headers['mcp-session-id'],
        nuclinoApiKey: req.headers['nuclino-api-key'] ? '[REDACTED]' : undefined,
        userAgent: req.headers['user-agent']
      });
      
      // Check for existing session ID
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let transport: StreamableHTTPServerTransport;

      if (sessionId && this.transports[sessionId]) {
        // Reuse existing transport
        transport = this.transports[sessionId];
        
        // Update API key for existing session
        const nuclinoApiKey = req.headers['nuclino-api-key'] as string;
        if (nuclinoApiKey) {
          this.apiKeys[sessionId] = nuclinoApiKey;
          // Update the repository with the new API key
          if (this.repositories[sessionId]) {
            this.repositories[sessionId].updateApiKey(nuclinoApiKey);
          }
        }
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId) => {
            // Store the transport by session ID
            this.transports[sessionId] = transport;
          },
          // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
          // locally, make sure to set:
          // enableDnsRebindingProtection: true,
          // allowedHosts: ['127.0.0.1'],
        });

        // Clean up transport when closed
        transport.onclose = () => {
          if (transport.sessionId) {
            delete this.transports[transport.sessionId];
            delete this.apiKeys[transport.sessionId];
            delete this.repositories[transport.sessionId];
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

        // Create server for this session
        const server = this.createMcpServer(nuclinoApiKey);
        await server.connect(transport);

        // Store repository for this session
        if (transport.sessionId) {
          const rateLimiter = new RateLimiter(150, 1); // 150 requests per minute
          const retryHandler = new RetryHandler({
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 30000,
            backoffFactor: 2
          });
          const nuclinoRepository = new NuclinoRepository(nuclinoApiKey, rateLimiter, retryHandler);
          this.repositories[transport.sessionId] = nuclinoRepository;
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

    // Handle GET requests for server-to-client notifications via SSE
    this.app.get('/mcp', this.handleSessionRequest.bind(this));

    // Handle DELETE requests for session termination
    this.app.delete('/mcp', this.handleSessionRequest.bind(this));
  }

  private async handleSessionRequest(req: express.Request, res: express.Response) {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    if (!sessionId || !this.transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    const transport = this.transports[sessionId];
    await transport.handleRequest(req, res);
  }

  private createMcpServer(apiKey: string): McpServer {
    // Create dependencies using Clean Architecture
    const rateLimiter = new RateLimiter(150, 1); // 150 requests per minute
    const retryHandler = new RetryHandler({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2
    });
    const nuclinoRepository = new NuclinoRepository(apiKey, rateLimiter, retryHandler);

    // Create MCP server with dependencies
    const nuclinoMcpServer = new NuclinoMcpServer(nuclinoRepository);
    return nuclinoMcpServer.getServer();
  }

  async start(): Promise<void> {
    const port = this.config.port || 3000;
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        logger.info(`Nuclino MCP HTTP server started on port ${port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          logger.info('HTTP server stopped');
          resolve();
        });
      });
    }
  }

  async connectServer(server: McpServer): Promise<void> {
    // For HTTP transport, server connection is handled per session
    // This method is not used for HTTP transport
  }
}