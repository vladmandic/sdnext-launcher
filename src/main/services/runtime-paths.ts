import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';

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
  return path.join(getPortableBaseDir(), 'python-3.13.12.zip');
}

function getExecutableExtension(): string {
  return process.platform === 'win32' ? '.exe' : '';
}

export function getPrimaryGitExecutablePath(): string {
  const ext = getExecutableExtension();
  return path.join(getDefaultBinaryPath(), 'git', `git${ext}`);
}

export function getFallbackGitExecutablePath(): string {
  const ext = getExecutableExtension();
  if (process.platform === 'win32') {
    return path.join(getDefaultBinaryPath(), 'git', 'cmd', `git${ext}`);
  }
  // On Unix, same as primary
  return getPrimaryGitExecutablePath();
}

export function getPrimaryPythonExecutablePath(): string {
  const ext = getExecutableExtension();
  return path.join(getDefaultBinaryPath(), 'python', `python${ext}`);
}

export function getFallbackPythonExecutablePath(): string {
  const ext = getExecutableExtension();
  return path.join(getDefaultBinaryPath(), 'python', `python${ext}`);
}

export function getGitExecutablePath(): string {
  return fs.existsSync(getPrimaryGitExecutablePath()) ? getPrimaryGitExecutablePath() : getFallbackGitExecutablePath();
}

export function getPythonExecutablePath(): string {
  // First try portable Python (Windows only)
  const portablePython = getPrimaryPythonExecutablePath();
  if (fs.existsSync(portablePython)) {
    return portablePython;
  }
  
  const fallbackPortable = getFallbackPythonExecutablePath();
  if (fs.existsSync(fallbackPortable)) {
    return fallbackPortable;
  }
  
  // On non-Windows or if portable not available, try environment variable or system python
  if (process.env.PYTHON) {
    return process.env.PYTHON;
  }
  
  // Fallback to system python
  if (process.platform === 'win32') {
    return 'python.exe';
  }
  return 'python3';
}

export function isBootstrapAvailable(): boolean {
  // Bootstrap is only available on Windows with bundled runtimes
  return process.platform === 'win32';
}
