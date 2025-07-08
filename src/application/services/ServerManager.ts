import { ITransport, TransportConfig } from "../../infrastructure/transport/ITransport.js";
import { TransportFactory } from "../../infrastructure/transport/TransportFactory.js";
import { logger } from "../../infrastructure/http/Logger.js";

export class ServerManager {
  private transport?: ITransport;

  async start(config: TransportConfig): Promise<void> {
    try {
      this.transport = TransportFactory.create(config);
      await this.transport.start();
      logger.info(`Server started successfully with ${config.type} transport`);
    } catch (error) {
      logger.error('Failed to start server', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.transport) {
      try {
        await this.transport.stop();
        logger.info('Server stopped successfully');
      } catch (error) {
        logger.error('Error stopping server', error);
        throw error;
      }
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