import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function getExecutableDir(): string {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    return process.env.PORTABLE_EXECUTABLE_DIR;
  }
  if (!app.isPackaged) {
    return process.cwd();
  }
  return path.dirname(app.getPath('exe'));
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  scope: string;
  message: string;
  details?: unknown;
}

class LoggerService {
  private logFilePath: string;
  private queue: LogEntry[] = [];
  private isWriting = false;
  private logDir: string;
  private readonly MAX_QUEUE_SIZE = 1000; // Prevent unbounded queue growth

  constructor() {
    const exeDir = getExecutableDir();
    this.logDir = exeDir;
    this.logFilePath = path.join(this.logDir, 'launcher.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  private formatEntry(entry: LogEntry): string {
    const { timestamp, level, scope, message, details } = entry;
    const levelUpper = level.toUpperCase().padEnd(5);
    let line = `${timestamp} [${levelUpper}] [${scope}] ${message}`;
    
    if (details !== undefined) {
      try {
        const detailsStr = typeof details === 'string' ? details : JSON.stringify(details, null, 2);
        line += `\n  Details: ${detailsStr}`;
      } catch {
        line += `\n  Details: ${String(details)}`;
      }
    }
    
    return line;
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    return new Promise((resolve) => {
      // Prevent queue overflow - drop oldest entries if queue is full
      if (this.queue.length >= this.MAX_QUEUE_SIZE) {
        this.queue.shift(); // Remove oldest entry
      }
      
      this.queue.push(entry);
      
      if (this.isWriting) {
        resolve();
        return;
      }

      this.isWriting = true;
      setImmediate(() => this.flushQueue().finally(() => resolve()));
    });
  }

  private async flushQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isWriting = false;
      return;
    }

    const entriesToWrite = [...this.queue];
    this.queue = [];

    const content = entriesToWrite.map(entry => this.formatEntry(entry)).join('\n');
    
    return new Promise((resolve) => {
      fs.appendFile(this.logFilePath, content + '\n', 'utf8', (error) => {
        if (error) {
          console.error('Failed to write to log file:', error);
        }
        this.isWriting = false;
        resolve();
      });
    });
  }

  private log(level: LogLevel, scope: string, message: string, details?: unknown): void {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    const entry: LogEntry = { timestamp, level, scope, message, details };
    const consolePrefix = `${timestamp} [${levelUpper}] [${scope}] ${message}`;
    
    // Console output
    if (level === 'debug') {
      if (details !== undefined) {
        console.log(consolePrefix, details);
      } else {
        console.log(consolePrefix);
      }
    } else if (level === 'info') {
      if (details !== undefined) {
        console.log(consolePrefix, details);
      } else {
        console.log(consolePrefix);
      }
    } else if (level === 'warn') {
      if (details !== undefined) {
        console.warn(consolePrefix, details);
      } else {
        console.warn(consolePrefix);
      }
    } else if (level === 'error') {
      if (details !== undefined) {
        console.error(consolePrefix, details);
      } else {
        console.error(consolePrefix);
      }
    }
    
    // File output (async, non-blocking)
    this.writeToFile(entry).catch(error => {
      console.error('Logger error:', error);
    });
  }

  debug(scope: string, message: string, details?: unknown): void {
    this.log('debug', scope, message, details);
  }

  info(scope: string, message: string, details?: unknown): void {
    this.log('info', scope, message, details);
  }

  warn(scope: string, message: string, details?: unknown): void {
    this.log('warn', scope, message, details);
  }

  error(scope: string, message: string, details?: unknown): void {
    this.log('error', scope, message, details);
  }

  /**
   * Read entire log file content
   */
  async readLog(): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(this.logFilePath, 'utf8', (error, data) => {
        if (error) {
          if (error.code === 'ENOENT') {
            resolve(''); // No log file yet
          } else {
            reject(error);
          }
        } else {
          resolve(data);
        }
      });
    });
  }

  /**
   * Clear log file (for testing or reset)
   */
  async clearLog(): Promise<void> {
    await this.flushQueue(); // Ensure pending writes complete
    return new Promise((resolve, reject) => {
      fs.writeFile(this.logFilePath, '', 'utf8', (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get log file path
   */
  getLogFilePath(): string {
    return this.logFilePath;
  }
}

// Singleton instance
let instance: LoggerService | null = null;

export function getLogger(): LoggerService {
  if (!instance) {
    instance = new LoggerService();
  }
  return instance;
}

export default getLogger();
