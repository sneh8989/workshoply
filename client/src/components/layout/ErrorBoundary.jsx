import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
          <div className="bg-surface max-w-md w-full p-8 rounded-2xl shadow-card border border-border space-y-5">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-main">Something went wrong</h1>
              <p className="text-xs text-muted leading-relaxed">
                An unexpected interface error occurred. You can reload this page or return home.
              </p>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={this.handleReload}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Application
              </button>
              <a
                href="/"
                className="btn-outline text-xs flex items-center gap-1.5"
              >
                <Home className="w-3.5 h-3.5" />
                Back to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
