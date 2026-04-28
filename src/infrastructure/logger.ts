import type { Writable } from 'node:stream';
import winston from 'winston';
import type { Logger, LogMeta } from '../application/ports/logger.js';

export interface WinstonLoggerOptions {
  readonly level?: string;
  readonly stream?: Writable;
}

const buildTransport = (
  stream: Writable | undefined,
): winston.transport => {
  if (stream) {
    return new winston.transports.Stream({ stream });
  }
  return new winston.transports.Console();
};

export class WinstonLogger implements Logger {
  private readonly logger: winston.Logger;

  constructor(options: WinstonLoggerOptions = {}) {
    this.logger = winston.createLogger({
      level: options.level ?? 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [buildTransport(options.stream)],
    });
  }

  debug(message: string, meta?: LogMeta): void {
    this.write('debug', message, meta);
  }

  info(message: string, meta?: LogMeta): void {
    this.write('info', message, meta);
  }

  warn(message: string, meta?: LogMeta): void {
    this.write('warn', message, meta);
  }

  error(message: string, meta?: LogMeta): void {
    this.write('error', message, meta);
  }

  private write(level: 'debug' | 'info' | 'warn' | 'error', message: string, meta: LogMeta | undefined): void {
    if (meta === undefined) {
      this.logger.log(level, message);
      return;
    }
    this.logger.log(level, message, meta);
  }
}
