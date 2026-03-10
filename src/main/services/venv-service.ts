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
  let result;
  try {
    result = spawnSync(portablePythonPath, ['-m', 'venv', path.join(installationPath, 'venv')], {
      cwd: installationPath,
      encoding: 'utf8',
      windowsHide: true,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to invoke python to create venv (${portablePythonPath}): ${msg}`);
  }

  if (result.error) {
    // Node.js may set result.error when spawn fails (missing executable, etc.)
    const errMsg = result.error instanceof Error ? result.error.message : String(result.error);
    throw new Error(`Error launching python for venv creation: ${errMsg}`);
  }

  if (result.stdout) {
    onOutput(result.stdout);
  }
  if (result.stderr) {
    onOutput(result.stderr, true);
  }

  if (result.status !== 0 || !fs.existsSync(venvPython)) {
    const exitCode = result.status;
    const stderrText = result.stderr ? result.stderr.trim() : '<none>';
    throw new Error(
      `venv creation failed (exit ${exitCode}); stderr: ${stderrText}`
    );
  }

  return venvPython;
}
