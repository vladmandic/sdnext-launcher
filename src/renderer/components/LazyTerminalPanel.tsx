import { lazy, Suspense } from 'react';

// Lazy load the heavy TerminalPanel component with xterm.js
const TerminalPanel = lazy(() =>
  import('./TerminalPanel').then((module) => ({ default: module.TerminalPanel })),
);

interface LazyTerminalPanelProps {
  lines: string[];
  onDimensionsChange?: (cols: number, rows: number) => void;
  isActive: boolean;
  isDarkTheme?: boolean;
}

/**
 * Lazy-loaded wrapper for TerminalPanel
 * Only loads xterm.js when terminal tab becomes active
 */
export function LazyTerminalPanel({ lines, onDimensionsChange, isActive, isDarkTheme = true }: LazyTerminalPanelProps) {
  // Don't render anything until tab is active
  if (!isActive) {
    return null;
  }

  return (
    <Suspense fallback={<div className="panel-message">Loading terminal...</div>}>
      <TerminalPanel lines={lines} onDimensionsChange={onDimensionsChange} isDarkTheme={isDarkTheme} />
    </Suspense>
  );
}
