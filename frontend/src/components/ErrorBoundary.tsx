import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, LogOut } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Placement Portal UI:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    localStorage.removeItem('placement_portal_token');
    localStorage.removeItem('placement_portal_user');
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-8 border border-[#E2E8F0] text-center space-y-5">
            <div className="h-14 w-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <AlertCircle className="h-8 w-8" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">
                Unable to connect to the Placement Portal server
              </h2>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                An unexpected communication or rendering error occurred. Please verify your backend server connection or try refreshing the portal.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl transition inline-flex items-center justify-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reload Portal</span>
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-50 text-[#64748B] border border-[#E2E8F0] font-bold text-xs rounded-xl transition inline-flex items-center justify-center gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Return to Login</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
