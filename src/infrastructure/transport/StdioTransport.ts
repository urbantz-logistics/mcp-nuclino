import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ITransport, TransportConfig } from "./ITransport.js";
import { logger } from "../http/Logger.js";
import { NuclinoRepository } from "../nuclino/NuclinoRepository.js";
import { RateLimiter } from "../nuclino/RateLimiter.js";
import { RetryHandler } from "../nuclino/RetryHandler.js";
import { NuclinoMcpServer } from "../../presentation/McpServer.js";

export class StdioTransport implements ITransport {
  private transport?: StdioServerTransport;
  private server?: McpServer;

  constructor(private config: TransportConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required for stdio transport');
    }
  }

  async start(): Promise<void> {
    logger.info('Starting Nuclino MCP stdio server');
    
    // Create server
    this.server = this.createMcpServer(this.config.apiKey!);
    
    // Create stdio transport
    this.transport = new StdioServerTransport();
    
    // Connect server to transport
    await this.server.connect(this.transport);
    
    logger.info('Nuclino MCP stdio server started');
  }

  async stop(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      logger.info('Stdio server stopped');
    }
  }

  async connectServer(server: McpServer): Promise<void> {
    if (!this.transport) {
      throw new Error('Transport not initialized');
    }
    await server.connect(this.transport);
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
}