import { Writable } from 'node:stream';
import { WinstonLogger } from './logger.js';

interface CapturedLog {
  readonly level: string;
  readonly message: string;
  readonly [key: string]: unknown;
}

const captureStream = (): { stream: Writable; lines: () => CapturedLog[] } => {
  const buffers: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer | string, _enc, cb): void {
      buffers.push(typeof chunk === 'string' ? chunk : chunk.toString('utf8'));
      cb();
    },
  });
  const lines = (): CapturedLog[] =>
    buffers
      .join('')
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as CapturedLog);
  return { stream, lines };
};

describe('WinstonLogger', () => {
  it('writes JSON-formatted info entries with metadata to the configured stream', () => {
    const { stream, lines } = captureStream();
    const logger = new WinstonLogger({ stream, level: 'debug' });

    logger.info('user signed up', { userId: 'u-1' });

    const records = lines();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      level: 'info',
      message: 'user signed up',
      userId: 'u-1',
    });
    expect(records[0]?.['timestamp']).toEqual(expect.any(String));
  });

  it('emits debug, warn, and error levels without metadata', () => {
    const { stream, lines } = captureStream();
    const logger = new WinstonLogger({ stream, level: 'debug' });

    logger.debug('d');
    logger.warn('w');
    logger.error('e');

    const levels = lines().map((r) => r.level);
    expect(levels).toEqual(['debug', 'warn', 'error']);
  });

  it('respects the configured level (suppresses lower priority messages)', () => {
    const { stream, lines } = captureStream();
    const logger = new WinstonLogger({ stream, level: 'warn' });

    logger.debug('d');
    logger.info('i');
    logger.warn('w');

    expect(lines().map((r) => r.level)).toEqual(['warn']);
  });

  it('constructs a default Console-backed logger when no options are provided', () => {
    expect(() => new WinstonLogger()).not.toThrow();
  });
});
