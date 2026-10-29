"use client";

import { Component, ReactNode } from "react";
import { BTN_SECONDARY } from "@/lib/styles";

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
          <div role="alert" className="flex min-h-[400px] items-center justify-center bg-void p-8">
            <div className="max-w-md">
              <h2 className="font-display text-4xl font-light text-lilac">This part of the page stopped working</h2>
              <p className="mt-4 text-sm font-light leading-relaxed text-ink-3">
                {this.state.error?.message || "An unexpected error occurred."} Your
                conversation is saved; reloading usually fixes this.
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className={`mt-8 ${BTN_SECONDARY}`}
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
