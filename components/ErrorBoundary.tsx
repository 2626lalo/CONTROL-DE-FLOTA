import React, { Component, ErrorInfo, ReactNode } from 'react';
import { LucideShieldAlert, LucideRefreshCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// FIX: Explicitly extending React.Component with generics to ensure inherited members 'props' and 'state' are correctly typed and recognized by the compiler.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // FIX: Declaring state as a class property AND initializing in constructor for better compatibility with TypeScript's member detection.
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  // FIX: Maintain strict type safety for ErrorInfo in the componentDidCatch lifecycle method
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Critical Runtime Error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  // FIX: Accessing members via this.state and this.props to resolve existence errors on line 42.
  public render(): ReactNode {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-3xl max-w-lg w-full text-center border-t-[12px] border-rose-500">
            <div className="mx-auto bg-rose-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mb-10 text-rose-600 shadow-inner">
              <LucideShieldAlert size={48} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter italic leading-none">Error del Sistema</h1>
            <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed px-4">
              Se ha detectado una anomalía crítica en la sesión. Los datos en la nube están protegidos.
            </p>
            
            <div className="bg-slate-900 p-6 rounded-3xl text-[10px] text-left font-mono text-blue-400 mb-10 overflow-auto max-h-40 border border-white/10 shadow-lg">
               <span className="text-rose-400 font-black">LOG_CRITICAL:</span> {error?.message || "Cloud Connection Lost"}
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={this.handleReload} 
                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-2xl"
              >
                <LucideRefreshCcw size={20}/> Reiniciar Aplicación
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}
