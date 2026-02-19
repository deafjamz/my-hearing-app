import { Component, ReactNode } from 'react';
import { Button } from '@/components/primitives';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info.componentStack);

    // Auto-reload on stale chunk errors (happens after new deploys)
    if (this.isChunkError(error)) {
      const key = 'chunk_reload';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
        return;
      }
      sessionStorage.removeItem(key);
    }
  }

  private isChunkError(error: Error): boolean {
    const msg = error.message || '';
    return (
      msg.includes('dynamically imported module') ||
      msg.includes('Failed to fetch') ||
      msg.includes('Loading chunk') ||
      msg.includes('Loading CSS chunk')
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunk = this.state.error ? this.isChunkError(this.state.error) : false;

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold text-white">
              {isChunk ? 'App Updated' : 'Something went wrong'}
            </h1>
            <p className="text-slate-400">
              {isChunk
                ? 'A new version of SoundSteps is available. Please refresh to continue.'
                : 'The app ran into an unexpected error. This has been logged.'}
            </p>
            {!isChunk && this.state.error && (
              <pre className="text-left text-xs text-red-400 bg-slate-900 rounded-lg p-4 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center pt-2">
              <Button
                size="sm"
                onClick={isChunk ? this.handleReload : this.handleRetry}
                className="rounded-lg"
              >
                {isChunk ? 'Refresh' : 'Try Again'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.assign('/')}
                className="rounded-lg"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
