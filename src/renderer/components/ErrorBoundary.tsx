import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
    console.error('React error boundary caught:', error, errorInfo);
    this.setState({
      errorInfo: errorInfo.componentStack || 'No stack trace available',
    });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          maxWidth: '800px',
          margin: '0 auto',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h1 style={{ color: '#ff6b6b', marginBottom: '20px' }}>
            Something went wrong
          </h1>
          <div style={{
            background: '#1a1a1a',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            <h2 style={{ color: '#ffd43b', fontSize: '16px', marginBottom: '10px' }}>
              Error:
            </h2>
            <pre style={{
              color: '#ff6b6b',
              fontSize: '14px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {this.state.error?.message || 'Unknown error'}
            </pre>
            {this.state.errorInfo && (
              <>
                <h2 style={{ color: '#ffd43b', fontSize: '16px', marginTop: '20px', marginBottom: '10px' }}>
                  Component Stack:
                </h2>
                <pre style={{
                  color: '#888',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '200px',
                  overflow: 'auto',
                }}>
                  {this.state.errorInfo}
                </pre>
              </>
            )}
          </div>
          <button
            onClick={this.handleReload}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              background: '#228be6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
