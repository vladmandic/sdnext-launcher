import fs from 'node:fs';
import path from 'node:path';
import { spawn as spawnPty, type IPty } from 'node-pty';
import { killProcessTree } from './process-termination';
import { debugLog } from './debug';

export interface RunProcessInput {
  command: string;
  args: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
  logFilePath: string;
  onOutput: (chunk: string, isError?: boolean) => void;
  terminalCols?: number;
  terminalRows?: number;
  timeoutMs?: number; // Timeout in milliseconds, 0 = no timeout
}

export class ProcessRunner {
  private activeChild: IPty | null = null;
  private wasStopped = false;
  private timeoutHandle: NodeJS.Timeout | null = null;

  /**
   * Check if a process is currently running
   */
  public get isRunning(): boolean {
    return this.activeChild !== null;
  }

  /**
   * Run a process with PTY support for proper terminal emulation and color output
   * @param input Process configuration
   * @returns Exit code of the process
   */
  async run(input: RunProcessInput): Promise<number> {
    debugLog('process-runner', 'run invoked', {
      command: input.command,
      args: input.args,
      cwd: input.cwd,
      logFilePath: input.logFilePath,
      timeoutMs: input.timeoutMs,
    });
    if (this.activeChild) {
      throw new Error('Another process is already running.');
    }

    fs.mkdirSync(path.dirname(input.logFilePath), { recursive: true });
    const logStream = fs.createWriteStream(input.logFilePath, { flags: 'a' });

    return new Promise<number>((resolve, reject) => {
      try {
        // Enhance environment with terminal settings for color output
        const enhancedEnv = { ...input.env };
        
        // Set terminal dimensions
        if (input.terminalCols) {
          enhancedEnv.COLUMNS = String(input.terminalCols);
        }
        if (input.terminalRows) {
          enhancedEnv.LINES = String(input.terminalRows);
        }
        
        // Enable color output for Python and other tools
        enhancedEnv.TERM = 'xterm-256color';
        enhancedEnv.COLORTERM = 'truecolor';
        enhancedEnv.FORCE_COLOR = '1';
        enhancedEnv.TTY_COMPATIBLE = '1';
        enhancedEnv.PYTHONUNBUFFERED = '1';
        // For libraries that check for TTY
        enhancedEnv.TERM_PROGRAM = 'xterm';

        // Use node-pty to spawn process with real PTY (enables isatty() for color output)
        const ptyOptions = {
          name: 'xterm-256color',
          cols: input.terminalCols ?? 80,
          rows: input.terminalRows ?? 24,
          cwd: input.cwd,
          env: enhancedEnv,
          ...(process.platform === 'win32' ? {
            useConpty: true,
            conptyInheritCursor: false,
          } : {}),
        };
        
        const ptyProcess = spawnPty(input.command, input.args, ptyOptions);

        this.activeChild = ptyProcess;
        this.wasStopped = false;
        debugLog('process-runner', 'child process started with PTY', { pid: ptyProcess.pid });

        // Set timeout if specified
        if (input.timeoutMs && input.timeoutMs > 0) {
          this.timeoutHandle = setTimeout(() => {
            debugLog('process-runner', 'Process timeout reached, killing process', { pid: ptyProcess.pid, timeoutMs: input.timeoutMs });
            const timeoutMsg = `\n[timeout] Process exceeded ${input.timeoutMs}ms timeout, terminating...\n`;
            logStream.write(timeoutMsg);
            input.onOutput(timeoutMsg, false);
            this.activeChild?.kill();
          }, input.timeoutMs);
        }

        // Forward output and log it
        ptyProcess.onData((data) => {
          logStream.write(data);
          input.onOutput(data);
        });

        ptyProcess.onExit(({ exitCode }) => {
          debugLog('process-runner', 'child process closed', { code: exitCode, wasStopped: this.wasStopped });
          if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
            this.timeoutHandle = null;
          }
          this.activeChild = null;
          logStream.end();
          // If process was explicitly stopped, return success to avoid error status
          resolve(this.wasStopped ? 0 : exitCode);
        });
      } catch (error) {
        debugLog('process-runner', 'Failed to spawn process', error);
        // CRITICAL FIX: Clear timeout on spawn error to prevent timer leak
        if (this.timeoutHandle) {
          clearTimeout(this.timeoutHandle);
          this.timeoutHandle = null;
        }
        logStream.end();
        this.activeChild = null;
        reject(error);
      }
    });
  }

  /**
   * Stop the currently running process and its child processes
   */
  async stop(): Promise<void> {
    debugLog('process-runner', 'stop invoked', { pid: this.activeChild?.pid });
    
    // CRITICAL FIX: Clear timeout to prevent it firing after process is stopped
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
    
    if (!this.activeChild?.pid) {
      return;
    }
    this.wasStopped = true;
    const pid = this.activeChild.pid;
    // Kill the PTY process
    this.activeChild.kill();
    // Also ensure the entire process tree is terminated
    await killProcessTree(pid);
    this.activeChild = null;
  }
}
