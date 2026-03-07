import { spawn } from 'node:child_process';

export async function killProcessTree(pid: number): Promise<void> {
  if (!pid) {
    return;
  }

  await new Promise<void>((resolve) => {
    let killer;
    
    if (process.platform === 'win32') {
      // Windows: use taskkill with tree kill flag
      killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
      });
    } else {
      // Unix: use kill with negative pid to kill process group
      // This kills the process and all children
      killer = spawn('kill', ['-9', String(-pid)], {
        stdio: 'ignore',
      });
    }
    
    killer.on('exit', () => resolve());
    killer.on('error', () => resolve());
  });
}
