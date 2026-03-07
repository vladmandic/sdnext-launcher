import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

/**
 * Get the path to Python executable in a virtual environment
 * @param installationPath Path to the installation directory
 * @returns Path to venv python executable
 */
export function getVenvPythonPath(installationPath: string): string {
  // Windows: venv/Scripts/python.exe, Unix: venv/bin/python
  if (process.platform === 'win32') {
    return path.join(installationPath, 'venv', 'Scripts', 'python.exe');
  }
  return path.join(installationPath, 'venv', 'bin', 'python');
}

/**
 * Ensure a virtual environment exists, creating one if necessary
 * @param installationPath Path to the installation directory
 * @param portablePythonPath Path to the portable Python executable
 * @param onOutput Callback for output messages
 * @returns Path to venv python executable
 * @throws Error if venv creation fails
 */
export function ensureVenv(
  installationPath: string,
  portablePythonPath: string,
  onOutput: (text: string, isError?: boolean) => void,
): string {
  const venvPython = getVenvPythonPath(installationPath);
  if (fs.existsSync(venvPython)) {
    onOutput(`[venv] Using existing virtual environment: ${venvPython}\n`);
    return venvPython;
  }

  onOutput('[venv] Creating virtual environment at /venv\n');
  const result = spawnSync(portablePythonPath, ['-m', 'venv', path.join(installationPath, 'venv')], {
    cwd: installationPath,
    encoding: 'utf8',
    windowsHide: true,
  });

  if (result.stdout) {
    onOutput(result.stdout);
  }
  if (result.stderr) {
    onOutput(result.stderr, true);
  }

  if (result.status !== 0 || !fs.existsSync(venvPython)) {
    throw new Error('Failed to create /venv using bundled python-portable.');
  }

  return venvPython;
}
