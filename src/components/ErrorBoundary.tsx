import { Component, ReactNode } from 'react';

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
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
            <p className="text-slate-400">
              The app ran into an unexpected error. This has been logged.
            </p>
            {this.state.error && (
              <pre className="text-left text-xs text-red-400 bg-slate-900 rounded-lg p-4 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={this.handleRetry}
                className="px-5 py-2.5 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-400 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.assign('/')}
                className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
