import { ITransport } from "../../infrastructure/transport/ITransport.js";
import { contextLogger as logger } from "../../infrastructure/http/Logger.js";

export class ServerManager {
  constructor(private transport: ITransport) {}

  async start(): Promise<void> {
    try {
      await this.transport.start();
      logger.info('Server started successfully');
    } catch (error) {
      logger.error('Failed to start server', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      await this.transport.stop();
      logger.info('Server stopped successfully');
    } catch (error) {
      logger.error('Error stopping server', error);
      throw error;
    }
  }

  // Handle graceful shutdown
  setupGracefulShutdown(): void {
    const signals = ['SIGINT', 'SIGTERM', 'SIGUSR2'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        try {
          await this.stop();
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', error);
          process.exit(1);
        }
      });
    });
  }
}