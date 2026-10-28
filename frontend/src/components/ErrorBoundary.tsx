"use client";

import { Component, ReactNode } from "react";
import { BTN_PRIMARY_SM } from "@/lib/styles";

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
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-void">
            <div className="text-center max-w-md rounded-2xl bg-surface border border-edge-soft shadow-xl shadow-black/40 p-8">
              <span className="text-5xl mb-4 block">⚠️</span>
              <h2 className="text-xl font-bold text-ink mb-2">
                Something went wrong
              </h2>
              <p className="text-ink-4 mb-5 text-sm">
                {this.state.error?.message || "An unexpected error occurred."}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className={BTN_PRIMARY_SM}
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
          <div className="h-3 w-20 bg-surface-2 rounded" />
          <div className="bg-surface border border-edge-soft rounded-2xl rounded-bl-md p-4 space-y-2">
            <div className="h-3 w-full bg-surface-3 rounded" />
            <div className="h-3 w-4/5 bg-surface-3 rounded" />
            <div className="h-3 w-3/5 bg-surface-3 rounded" />
          </div>
        </div>
      </div>
      {/* User message skeleton */}
      <div className="flex justify-end">
        <div className="max-w-[60%]">
          <div className="bg-amethyst/40 rounded-2xl rounded-br-md p-4 space-y-2">
            <div className="h-3 w-full bg-amethyst-600/60 rounded" />
            <div className="h-3 w-2/3 bg-amethyst-600/60 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
