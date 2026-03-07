import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import type { ITheme } from '@xterm/xterm';

interface TerminalPanelProps {
  lines: string[];
  onDimensionsChange?: (cols: number, rows: number) => void;
  isDarkTheme?: boolean;
}

const darkTheme: ITheme = {
  background: '#0f1115',
  foreground: '#d9e1ee',
  cursor: '#d9e1ee',
  cursorAccent: '#0f1115',
  selectionBackground: 'rgba(71, 133, 133, 0.3)',
  black: '#000000',
  red: '#ff7b7b',
  green: '#7bff7b',
  yellow: '#ffff7b',
  blue: '#7b7bff',
  magenta: '#ff7bff',
  cyan: '#7bffff',
  white: '#d9e1ee',
  brightBlack: '#666666',
  brightRed: '#ffaaaa',
  brightGreen: '#aaffaa',
  brightYellow: '#ffffaa',
  brightBlue: '#aaaaff',
  brightMagenta: '#ffaaff',
  brightCyan: '#aaffff',
  brightWhite: '#ffffff',
};

const lightTheme: ITheme = {
  background: '#f8fafb',
  foreground: '#1a2332',
  cursor: '#0d9488',
  cursorAccent: '#f8fafb',
  selectionBackground: 'rgba(13, 148, 136, 0.2)',
  black: '#1a2332',
  red: '#dc2626',
  green: '#059669',
  yellow: '#d97706',
  blue: '#2563eb',
  magenta: '#9333ea',
  cyan: '#0891b2',
  white: '#64748b',
  brightBlack: '#475569',
  brightRed: '#ef4444',
  brightGreen: '#10b981',
  brightYellow: '#f59e0b',
  brightBlue: '#3b82f6',
  brightMagenta: '#a855f7',
  brightCyan: '#06b6d4',
  brightWhite: '#0f172a',
};

export function TerminalPanel({ lines, onDimensionsChange, isDarkTheme = true }: TerminalPanelProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const renderedCountRef = useRef(0);

  useEffect(() => {
    if (!mountRef.current) {
      return;
    }

    const terminal = new Terminal({
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 13,
      rows: 18,
      convertEol: true,
      scrollback: 10000,
      allowTransparency: false,
      theme: isDarkTheme ? darkTheme : lightTheme,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(mountRef.current);

    const safeFit = (): void => {
      if (!mountRef.current || !terminalRef.current) {
        return;
      }

      // FitAddon can throw during early lifecycle/race windows in dev StrictMode.
      try {
        fitAddon.fit();
        // Notify parent of dimension changes
        if (onDimensionsChange) {
          onDimensionsChange(terminalRef.current.cols, terminalRef.current.rows);
        }
      } catch {
        // Ignore transient fit errors; next resize/event will retry.
      }
    };

    terminalRef.current = terminal;

    requestAnimationFrame(() => {
      safeFit();
    });

    const resizeObserver = new ResizeObserver(() => {
      safeFit();
    });
    resizeObserver.observe(mountRef.current);

    // Auto-copy selection to clipboard
    const selectionDisposable = terminal.onSelectionChange(() => {
      const selection = terminal.getSelection();
      if (selection) {
        navigator.clipboard.writeText(selection).catch(() => {
          // Silently ignore clipboard errors
        });
      }
    });

    return () => {
      resizeObserver.disconnect();
      selectionDisposable.dispose();
      terminalRef.current?.dispose();
      terminalRef.current = null;
    };
  }, [onDimensionsChange, isDarkTheme]);

  // Update terminal theme when isDarkTheme changes
  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) {
      return;
    }
    terminal.options.theme = isDarkTheme ? darkTheme : lightTheme;
  }, [isDarkTheme]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) {
      return;
    }

    if (lines.length < renderedCountRef.current) {
      terminal.reset();
      renderedCountRef.current = 0;
    }

    for (let i = renderedCountRef.current; i < lines.length; i += 1) {
      const chunk = lines[i];
      if (!chunk) {
        continue;
      }
      terminal.write(chunk);
    }

    renderedCountRef.current = lines.length;
  }, [lines]);

  return <div className="terminal-panel" ref={mountRef} />;
}
