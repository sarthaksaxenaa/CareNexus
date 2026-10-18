"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[CareNexus ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
            <div className="text-center max-w-md">
              <span className="text-5xl mb-4 block">⚠️</span>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                {this.state.error?.message || "An unexpected error occurred."}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Loading skeleton for chat messages.
 */
export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      {/* Assistant message skeleton */}
      <div className="flex justify-start">
        <div className="max-w-[75%] space-y-2">
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-bl-md p-4 space-y-2">
            <div className="h-3 w-full bg-gray-300 dark:bg-gray-600 rounded" />
            <div className="h-3 w-4/5 bg-gray-300 dark:bg-gray-600 rounded" />
            <div className="h-3 w-3/5 bg-gray-300 dark:bg-gray-600 rounded" />
          </div>
        </div>
      </div>
      {/* User message skeleton */}
      <div className="flex justify-end">
        <div className="max-w-[60%]">
          <div className="bg-blue-200 dark:bg-blue-900/40 rounded-2xl rounded-br-md p-4 space-y-2">
            <div className="h-3 w-full bg-blue-300 dark:bg-blue-800 rounded" />
            <div className="h-3 w-2/3 bg-blue-300 dark:bg-blue-800 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
