import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export interface ITransport {
  start(): Promise<void>;
  stop(): Promise<void>;
  connectServer(server: McpServer): Promise<void>;
}

export type TransportType = 'http' | 'stdio';

export interface TransportConfig {
  type: TransportType;
  port?: number; // For HTTP transport
  apiKey?: string; // For authentication
}