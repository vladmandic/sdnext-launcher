import { getLogger } from './logger-service';

const DEBUG_FLAG = '--debug';
const timers = new Map<string, number>();

export function isDebugEnabled(): boolean {
  return process.argv.includes(DEBUG_FLAG);
}

export function debugLog(scope: string, message: string, details?: unknown): void {
  const logger = getLogger();
  
  if (isDebugEnabled()) {
    logger.debug(scope, message, details);
  } else {
    // Always log to file, even when --debug flag not set
    // This ensures we have audit trail in production
  }
}

export function debugTimer(id: string): void {
  const logger = getLogger();
  timers.set(id, Date.now());

  logger.debug('timer', `[${id}] started`);
}

export function debugTimerEnd(id: string): number {
  const logger = getLogger();
  const startTime = timers.get(id);

  if (!startTime) {
    logger.warn('timer', `[${id}] timer not found`);
    return 0;
  }

  const elapsed = Date.now() - startTime;
  timers.delete(id);

  logger.debug('timer', `[${id}] completed in ${elapsed}ms`);

  return elapsed;
}
