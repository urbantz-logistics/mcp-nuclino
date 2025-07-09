import { ServerManager } from "./application/services/ServerManager.js";
import { Config } from "./infrastructure/config/Config.js";
import { HttpTransport } from "./infrastructure/transport/HttpTransport.js";
import { StdioTransport } from "./infrastructure/transport/StdioTransport.js";
import { contextLogger as logger } from "./infrastructure/http/Logger.js";

async function main() {
  try {
    // Get configuration
    const config = Config.getTransportConfig();
    
    // Create transport based on configuration
    const transport = config.type === 'http' 
      ? new HttpTransport(config)
      : new StdioTransport(config);
    
    // Create and start server
    const serverManager = new ServerManager(transport);
    serverManager.setupGracefulShutdown();
    
    await serverManager.start();
    
    logger.info('Application started successfully');
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

main().catch(error => {
  logger.error('Unhandled error in main', error);
  process.exit(1);
});