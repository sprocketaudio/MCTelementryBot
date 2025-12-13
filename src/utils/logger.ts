export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const formatTimestamp = () => new Date().toISOString();

export const logger = {
  info: (message: string, ...meta: unknown[]) =>
    console.log(`[${formatTimestamp()}] [INFO] ${message}`, ...meta),
  warn: (message: string, ...meta: unknown[]) =>
    console.warn(`[${formatTimestamp()}] [WARN] ${message}`, ...meta),
  error: (message: string, ...meta: unknown[]) =>
    console.error(`[${formatTimestamp()}] [ERROR] ${message}`, ...meta),
  debug: (message: string, ...meta: unknown[]) =>
    console.debug(`[${formatTimestamp()}] [DEBUG] ${message}`, ...meta),
};
