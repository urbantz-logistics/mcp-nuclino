import { ITransport, TransportConfig } from "./ITransport.js";
import { HttpTransport } from "./HttpTransport.js";
import { StdioTransport } from "./StdioTransport.js";

export class TransportFactory {
  static create(config: TransportConfig): ITransport {
    switch (config.type) {
      case 'http':
        return new HttpTransport(config);
      case 'stdio':
        return new StdioTransport(config);
      default:
        throw new Error(`Unsupported transport type: ${config.type}`);
    }
  }
}