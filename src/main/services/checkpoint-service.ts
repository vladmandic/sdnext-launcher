import * as fs from 'fs';
import * as path from 'path';
import { getLogger } from './logger-service';

export type InstallationCheckpoint = 
  | 'start'
  | 'git-clone'
  | 'git-checkout'
  | 'venv-created'
  | 'dependencies-installed'
  | 'sandbox-test-passed'
  | 'complete';

interface CheckpointData {
  installationPath: string;
  timestamp: string;
  completedSteps: InstallationCheckpoint[];
  lastError?: string;
  lastErrorTime?: string;
}

class CheckpointService {
  private checkpointDir: string;

  constructor(installationPath: string) {
    this.checkpointDir = path.join(installationPath, '.install-checkpoint');
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.checkpointDir)) {
      fs.mkdirSync(this.checkpointDir, { recursive: true });
    }
  }

  private getCheckpointFilePath(): string {
    return path.join(this.checkpointDir, 'checkpoint.json');
  }

  /**
   * Load checkpoint data from disk
   */
  loadCheckpoint(): CheckpointData | null {
    try {
      const filePath = this.getCheckpointFilePath();
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content) as CheckpointData;
    } catch (error) {
      getLogger().warn('checkpoint', 'Failed to load checkpoint', { error });
      return null;
    }
  }

  /**
   * Save checkpoint data to disk
   */
  saveCheckpoint(checkpoint: CheckpointData): void {
    try {
      this.ensureDir();
      const filePath = this.getCheckpointFilePath();
      fs.writeFileSync(filePath, JSON.stringify(checkpoint, null, 2), 'utf8');
    } catch (error) {
      getLogger().error('checkpoint', 'Failed to save checkpoint', { error });
    }
  }

  /**
   * Mark a step as completed
   */
  markStepCompleted(checkpoint: CheckpointData, step: InstallationCheckpoint): CheckpointData {
    if (!checkpoint.completedSteps.includes(step)) {
      checkpoint.completedSteps.push(step);
      checkpoint.timestamp = new Date().toISOString();
      this.saveCheckpoint(checkpoint);
    }
    return checkpoint;
  }

  /**
   * Mark an error occurred at this step
   */
  markError(checkpoint: CheckpointData, error: Error | string): CheckpointData {
    checkpoint.lastError = error instanceof Error ? error.message : String(error);
    checkpoint.lastErrorTime = new Date().toISOString();
    this.saveCheckpoint(checkpoint);
    return checkpoint;
  }

  /**
   * Check if a specific step was completed
   */
  isStepCompleted(checkpoint: CheckpointData | null, step: InstallationCheckpoint): boolean {
    if (!checkpoint) return false;
    return checkpoint.completedSteps.includes(step);
  }

  /**
   * Get the next step to execute based on checkpoint
   */
  getNextStep(checkpoint: CheckpointData | null): InstallationCheckpoint {
    if (!checkpoint) return 'start';

    const stepSequence: InstallationCheckpoint[] = [
      'start',
      'git-clone',
      'git-checkout',
      'venv-created',
      'dependencies-installed',
      'sandbox-test-passed',
      'complete',
    ];

    for (const step of stepSequence) {
      if (!checkpoint.completedSteps.includes(step)) {
        return step;
      }
    }

    return 'complete';
  }

  /**
   * Clear checkpoint (on successful completion or explicit reset)
   */
  clearCheckpoint(): void {
    try {
      const filePath = this.getCheckpointFilePath();
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      // Clean up the checkpoint directory if empty
      if (fs.existsSync(this.checkpointDir)) {
        const files = fs.readdirSync(this.checkpointDir);
        if (files.length === 0) {
          fs.rmdirSync(this.checkpointDir);
        }
      }
    } catch (error) {
      getLogger().warn('checkpoint', 'Failed to clear checkpoint', { error });
    }
  }

  /**
   * Initialize a new checkpoint for an installation
   */
  createCheckpoint(installationPath: string): CheckpointData {
    const checkpoint: CheckpointData = {
      installationPath,
      timestamp: new Date().toISOString(),
      completedSteps: [],
    };
    this.saveCheckpoint(checkpoint);
    return checkpoint;
  }
}

export function getCheckpointService(installationPath: string): CheckpointService {
  return new CheckpointService(installationPath);
}
