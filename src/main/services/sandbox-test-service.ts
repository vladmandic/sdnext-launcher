import { spawnSync } from 'node:child_process';
import { getLogger } from './logger-service';

export interface SandboxTestResult {
  healthy: boolean;
  pythonOk: boolean;
  pipOk: boolean;
  venvPathOk: boolean;
  errors: string[];
}

/**
 * Run a sandbox test on a Python VENV to validate it's healthy
 * Tests: Python execution, pip availability, site-packages presence
 * @param pythonExePath Full path to python.exe in venv
 * @returns Test result with health status and error details
 */
export function runSandboxTest(pythonExePath: string): SandboxTestResult {
  const logger = getLogger();
  const errors: string[] = [];
  let pythonOk = false;
  let pipOk = false;
  let venvPathOk = false;

  logger.debug('sandbox-test', 'Starting venv health check', { pythonExePath });

  // Test 1: Python executable exists and runs
  try {
    const result = spawnSync(pythonExePath, ['-c', 'import sys; print(sys.version)'], {
      encoding: 'utf8',
      timeout: 10000,
      windowsHide: true,
    });

    if (result.status === 0 && result.stdout) {
      pythonOk = true;
      logger.info('sandbox-test', 'Python execution OK', { version: result.stdout.trim() });
    } else {
      errors.push(`Python execution failed: ${result.stderr || 'no output'}`);
    }
  } catch (error) {
    errors.push(`Failed to execute Python: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Test 2: Check site-packages exists
  if (pythonOk) {
    try {
      const result = spawnSync(pythonExePath, ['-c', 'import site; print(site.getsitepackages()[0] if site.getsitepackages() else site.getusersitepackages())'], {
        encoding: 'utf8',
        timeout: 10000,
        windowsHide: true,
      });

      if (result.status === 0 && result.stdout) {
        venvPathOk = true;
        logger.info('sandbox-test', 'Site-packages path OK', { path: result.stdout.trim() });
      } else {
        errors.push(`Could not determine site-packages: ${result.stderr || 'no output'}`);
      }
    } catch (error) {
      errors.push(`Failed to check site-packages: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Test 3: pip availability (not critical, but good to know)
  if (pythonOk) {
    try {
      const result = spawnSync(pythonExePath, ['-m', 'pip', '--version'], {
        encoding: 'utf8',
        timeout: 10000,
        windowsHide: true,
      });

      if (result.status === 0) {
        pipOk = true;
        logger.info('sandbox-test', 'Pip available', { version: result.stdout.trim() });
      } else {
        logger.warn('sandbox-test', 'Pip not available', { stderr: result.stderr });
      }
    } catch (error) {
      logger.warn('sandbox-test', 'Failed to check pip', { error });
    }
  }

  const healthy = pythonOk && venvPathOk;
  const result: SandboxTestResult = {
    healthy,
    pythonOk,
    pipOk,
    venvPathOk,
    errors,
  };

  const status = healthy ? 'HEALTHY' : 'UNHEALTHY';
  logger.info('sandbox-test', `Venv health check ${status}`, result);

  return result;
}

/**
 * Run detailed venv diagnostics for troubleshooting
 * @param pythonExePath Full path to python.exe in venv
 * @returns Diagnostic information
 */
export function runDiagnostics(pythonExePath: string): Record<string, unknown> {
  const logger = getLogger();
  const diagnostics: Record<string, unknown> = {};

  logger.debug('diagnostics', 'Running venv diagnostics', { pythonExePath });

  // Get Python version and implementation
  try {
    const result = spawnSync(pythonExePath, ['-c', 'import sys; print(f"{sys.implementation.name} {sys.version}")'], {
      encoding: 'utf8',
      timeout: 10000,
      windowsHide: true,
    });
    if (result.status === 0) {
      diagnostics.version = result.stdout.trim();
    }
  } catch {
    diagnostics.version = 'unavailable';
  }

  // Get executable path
  try {
    const result = spawnSync(pythonExePath, ['-c', 'import sys; print(sys.executable)'], {
      encoding: 'utf8',
      timeout: 10000,
      windowsHide: true,
    });
    if (result.status === 0) {
      diagnostics.executable = result.stdout.trim();
    }
  } catch {
    diagnostics.executable = 'unavailable';
  }

  // Get sys.path
  try {
    const result = spawnSync(pythonExePath, ['-c', 'import sys; print("\\n".join(sys.path))'], {
      encoding: 'utf8',
      timeout: 10000,
      windowsHide: true,
    });
    if (result.status === 0) {
      diagnostics.syspath = result.stdout.trim().split('\n');
    }
  } catch {
    diagnostics.syspath = 'unavailable';
  }

  // Get installed packages count
  try {
    const result = spawnSync(pythonExePath, ['-m', 'pip', 'list', '--format=json'], {
      encoding: 'utf8',
      timeout: 30000,
      windowsHide: true,
    });
    if (result.status === 0) {
      const packages = JSON.parse(result.stdout) as { name: string; version: string }[];
      diagnostics.installedPackages = packages.length;
      diagnostics.samplePackages = packages.slice(0, 10).map(p => `${p.name}==${p.version}`);
    }
  } catch {
    diagnostics.installedPackages = 'unavailable';
  }

  logger.info('diagnostics', 'Venv diagnostics complete', diagnostics);
  return diagnostics;
}
