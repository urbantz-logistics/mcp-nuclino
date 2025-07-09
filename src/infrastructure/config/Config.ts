import { TransportConfig, TransportType } from "../transport/ITransport.js";
import { contextLogger as logger } from "../http/Logger.js";

export class Config {
  static getTransportConfig(): TransportConfig {
    const transportType = (process.env.TRANSPORT_TYPE || 'http') as TransportType;
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const apiKey = process.env.NUCLINO_API_KEY;

    // Debug logging
    logger.info('Config debug:', {
      transportType,
      hasApiKey: !!apiKey
    });

    // Validate transport type
    if (!['http', 'stdio'].includes(transportType)) {
      throw new Error(`Invalid transport type: ${transportType}. Must be 'http' or 'stdio'`);
    }

    // For stdio transport, API key is required
    if (transportType === 'stdio' && !apiKey) {
      throw new Error('NUCLINO_API_KEY environment variable is required for stdio transport');
    }

    return {
      type: transportType,
      port: transportType === 'http' ? port : undefined,
      apiKey: apiKey
    };
  }

  static getDefaultConfig(): TransportConfig {
    return {
      type: 'http',
      port: 3000
    };
  }
}