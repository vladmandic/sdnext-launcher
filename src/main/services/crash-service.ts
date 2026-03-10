import { spawnSync } from 'node:child_process';
import { debugLog } from './debug';

/**
 * Attempt to retrieve information about the most recent Python crash from
 * platform-specific sources.  Currently only Windows is implemented; other
 * platforms return null.
 *
 * @param installationPath Optional installation path to help narrow the query.
 * @returns crash details string or null if none found.
 */
export function getPythonCrashDetails(installationPath?: string): string | null {
  try {
    if (process.platform !== 'win32') {
      return null;
    }

    debugLog('crash-service', 'querying Windows event log for python crash', { installationPath });

    // build a PowerShell command that searches the Application log for the
    // most recent "Application Error" entry mentioning python.exe or the
    // installation path.  limit to the last 10 minutes so we don't return
    // unrelated historical crashes.
    const cutoff = `(Get-Date).AddMinutes(-10)`;
    const filter = installationPath
      ? `*${installationPath.replace(/\\/g, '\\')}*`
      : '*python.exe*';

    const psCmd =
      `$cutoff=${cutoff}; ` +
      `Get-WinEvent -FilterHashtable @{LogName='Application'; StartTime=$cutoff} ` +
      `| where{ $_.ProviderName -eq 'Application Error' -and $_.Message -like '${filter}' } ` +
      `| select -First 1 | Format-List TimeCreated, Message | Out-String`;

    const result = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCmd], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 15000,
    });

    if (result.error) {
      debugLog('crash-service', 'event log query failed', { error: result.error });
      return null;
    }

    const output = (result.stdout || '').trim();
    if (!output) {
      return null;
    }

    debugLog('crash-service', 'found crash details', { output });
    return output;
  } catch (err) {
    debugLog('crash-service', 'exception while querying crash details', err);
    return null;
  }
}
