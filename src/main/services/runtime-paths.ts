import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';
import { debugLog } from './debug';

function getExecutableDir(): string {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    return process.env.PORTABLE_EXECUTABLE_DIR;
  }
  if (!app.isPackaged) {
    return process.cwd();
  }
  return path.dirname(app.getPath('exe'));
}

function getResourcesDir(): string {
  return process.resourcesPath;
}

export function getPortableBaseDir(): string {
  if (app.isPackaged) {
    return path.join(getResourcesDir(), 'portable');
  }
  return path.join(getExecutableDir(), 'portable');
}

export function getDefaultInstallationPath(): string {
  return path.join(getExecutableDir(), 'sdnext');
}

/**
 * Compute the base binary directory that contains portable runtimes.
 * When an installationPath is provided the binaries live under
 * `<installationPath>/bin`; otherwise the default path joined with
 * `bin` is returned (exe-dir/sdnext/bin).
 */
export function getBinaryPath(installationPath?: string): string {
  if (installationPath && installationPath.trim()) {
    return path.join(installationPath, 'bin');
  }
  return getDefaultBinaryPath();
}

export function getDefaultBinaryPath(): string {
  return path.join(getDefaultInstallationPath(), 'bin');
}

export function getDefaultModelsPath(installationPath: string): string {
  return path.join(installationPath, 'app', 'models');
}

export function getLogoPath(): string {
  if (app.isPackaged) {
    return path.join(getResourcesDir(), 'sdnext.png');
  }
  return path.join(getExecutableDir(), 'public', 'sdnext.png');
}

export function getWindowIconPath(): string {
  if (app.isPackaged) {
    return path.join(getResourcesDir(), 'logo.png');
  }
  return path.join(getExecutableDir(), 'public', 'logo.png');
}

export function getConfigPath(): string {
  return path.join(getExecutableDir(), 'sdnext.json');
}

export function getBundledGitZipPath(): string {
  return path.join(getPortableBaseDir(), 'nuget-git-2.53.0.zip');
}

export function getBundledPythonZipPath(): string {
  return path.join(getPortableBaseDir(), 'python-3.12.10.zip');
}

function getExecutableExtension(): string {
  return process.platform === 'win32' ? '.exe' : '';
}

// Runtime executables are always resolved to absolute paths because callers may
// spawn them with a different working directory (e.g. venv creation uses installationPath).
export function getPrimaryGitExecutablePath(installationPath?: string): string {
  const ext = getExecutableExtension();
  const base = getBinaryPath(installationPath);
  return path.join(base, 'git', `git${ext}`);
}

export function getFallbackGitExecutablePath(installationPath?: string): string {
  const ext = getExecutableExtension();
  const base = getBinaryPath(installationPath);
  if (process.platform === 'win32') {
    return path.join(base, 'git', 'cmd', `git${ext}`);
  }
  // On Unix, same as primary
  return getPrimaryGitExecutablePath(installationPath);
}

export function getPrimaryPythonExecutablePath(installationPath?: string): string {
  const ext = getExecutableExtension();
  const base = getBinaryPath(installationPath);
  return path.join(base, 'python', `python${ext}`);
}

export function getFallbackPythonExecutablePath(installationPath?: string): string {
  const ext = getExecutableExtension();
  const base = getBinaryPath(installationPath);
  return path.join(base, 'python', `python${ext}`);
}

export function getGitExecutablePath(installationPath?: string): string {
  const primary = getPrimaryGitExecutablePath(installationPath);
  const fallback = getFallbackGitExecutablePath(installationPath);
  const resolved = fs.existsSync(primary) ? primary : fallback;
  debugLog('runtime-paths', 'Resolved Git executable', {
    installationPath,
    primary,
    fallback,
    resolved,
  });
  return resolved;
}

export function getPythonExecutablePath(installationPath?: string): string {
  // First try portable Python (Windows only)
  const primary = getPrimaryPythonExecutablePath(installationPath);
  if (fs.existsSync(primary)) {
    debugLog('runtime-paths', 'Resolved Python executable from primary portable path', {
      installationPath,
      primary,
    });
    return primary;
  }
  
  const fallbackPortable = getFallbackPythonExecutablePath(installationPath);
  if (fs.existsSync(fallbackPortable)) {
    debugLog('runtime-paths', 'Resolved Python executable from fallback portable path', {
      installationPath,
      fallbackPortable,
    });
    return fallbackPortable;
  }
  
  // On non-Windows or if portable not available, try environment variable or system python
  if (process.env.PYTHON) {
    debugLog('runtime-paths', 'Resolved Python executable from PYTHON env', {
      installationPath,
      env: process.env.PYTHON,
    });
    return process.env.PYTHON;
  }
  
  // Fallback to system python
  const systemPython = process.platform === 'win32' ? 'python.exe' : 'python3';
  debugLog('runtime-paths', 'Resolved Python executable to system default', {
    installationPath,
    systemPython,
  });
  return systemPython;
}

export function isBootstrapAvailable(): boolean {
  // Bootstrap is only available on Windows with bundled runtimes
  return process.platform === 'win32';
}
