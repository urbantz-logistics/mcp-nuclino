import winston from "winston";

// Create base logger configuration
const createLogger = (useStderr: boolean = false) => {
  const transports: winston.transport[] = [
    new winston.transports.File({
      filename: './application.log',
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ];

  // Only add console transport if not using stdio (to avoid stdout pollution)
  if (!useStderr) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    );
  } else {
    // For stdio transport, use stderr to avoid corrupting stdout
    transports.push(
      new winston.transports.Console({
        stderrLevels: ['error', 'warn', 'info', 'debug'],
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    );
  }

  return winston.createLogger({
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports
  });
};

// Default logger for HTTP transport
export const logger = createLogger(false);

// Logger for stdio transport (uses stderr)
export const stdioLogger = createLogger(true);

// Context-aware logger that detects transport type from environment
export const contextLogger = process.env.TRANSPORT_TYPE === 'stdio' ? stdioLogger : logger;