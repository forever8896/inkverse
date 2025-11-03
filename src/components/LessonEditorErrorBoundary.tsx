'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary for Lesson Editor
 *
 * Catches JavaScript errors in the component tree and displays
 * a fallback UI instead of crashing the entire application.
 */
export class LessonEditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error('Lesson Editor Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);

    // Show user-friendly toast notification
    toast.error('Something went wrong in the lesson editor', {
      description: 'Your work has been preserved. Try refreshing the page.',
      duration: 10000,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-slate-800 border-2 border-red-500 rounded-xl p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💥</div>
              <h1 className="text-2xl font-bold text-red-400 mb-2">
                Lesson Editor Error
              </h1>
              <p className="text-slate-300">
                Something unexpected happened, but don't worry - your work is safe!
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-900 rounded-lg p-4 mb-6">
                <p className="text-sm font-mono text-red-300 mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs text-slate-400">
                    <summary className="cursor-pointer hover:text-slate-300">
                      Component Stack
                    </summary>
                    <pre className="mt-2 overflow-x-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 hover:border-purple-400 text-purple-300 hover:text-purple-100 font-pixel text-[10px] uppercase transition-all hover:shadow-lg hover:shadow-purple-500/20 rounded"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-cyan-100 font-pixel text-[10px] uppercase transition-all hover:shadow-lg hover:shadow-cyan-500/20 rounded"
              >
                Reload Page
              </button>
            </div>

            <div className="mt-6 p-4 bg-amber-900/20 border border-amber-600/30 rounded-lg">
              <p className="text-sm text-amber-200">
                💡 <strong>Tip:</strong> Check your browser console (F12) for more details.
                If the problem persists, please report it to the maintainers.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.ComponentType<P> {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <LessonEditorErrorBoundary fallback={fallback}>
        <Component {...props} />
      </LessonEditorErrorBoundary>
    );
  };
}
