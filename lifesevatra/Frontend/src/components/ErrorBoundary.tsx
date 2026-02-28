import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/overview';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted px-4">
          <div className="text-center max-w-lg">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.15)]">
              <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
            </div>

            <h1 className="text-3xl font-bold text-card-foreground mb-3">Something Went Wrong</h1>
            <p className="text-muted-foreground mb-4">
              An unexpected error occurred. Please try again or return to the dashboard.
            </p>

            {this.state.error && (
              <div className="mb-6 rounded-xl bg-red-500/5 border border-red-500/20 p-4 text-left">
                <p className="text-xs font-mono text-red-400 break-all">{this.state.error.message}</p>
              </div>
            )}

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl border border-border bg-card px-6 py-3 text-sm font-bold text-muted-foreground hover:text-card-foreground hover:border-primary/50 transition-all"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-green-950 hover:bg-[#3bf03b] shadow-[0_0_20px_rgba(19,236,19,0.4)] transition-all"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

