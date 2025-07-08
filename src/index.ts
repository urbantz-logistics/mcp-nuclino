import { ServerManager } from "./application/services/ServerManager.js";
import { Config } from "./infrastructure/config/Config.js";
import { logger } from "./infrastructure/http/Logger.js";

async function main() {
  try {
    // Get configuration
    const config = Config.getTransportConfig();
    
    // Create and start server
    const serverManager = new ServerManager();
    serverManager.setupGracefulShutdown();
    
    await serverManager.start(config);
    
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