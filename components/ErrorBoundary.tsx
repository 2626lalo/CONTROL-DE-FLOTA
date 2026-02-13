import React, { ReactNode, ErrorInfo } from 'react';
import { LucideShieldAlert, LucideRefreshCcw, LucideTrash2 } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// FIX: Explicitly using React.Component for inheritance ensures 'props' and 'state' are correctly resolved by the TypeScript compiler
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly defining state as a class property for better type inference and availability on 'this'
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Critical Runtime Error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetApp = () => {
    if (window.confirm("¡ATENCIÓN! Se eliminarán TODOS los datos de la base de datos local para intentar recuperar la aplicación. Esta acción es irreversible.")) {
      Object.keys(localStorage).forEach(key => {
          if (key.startsWith('fp_')) localStorage.removeItem(key);
      });
      this.handleReload();
    }
  };

  public render(): ReactNode {
    // FIX: Accessing inherited state and props from React.Component to resolve the error on line 49
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-3xl max-w-lg w-full text-center border-t-[12px] border-rose-500">
            <div className="mx-auto bg-rose-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mb-10 text-rose-600 shadow-inner">
              <LucideShieldAlert size={48} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter italic leading-none">Kernel Panic</h1>
            <p className="text-slate-500 mb-10 text-sm font-medium leading-relaxed px-4">
              Se ha detectado una corrupción en la sesión o una inconsistencia de datos crítica.
            </p>
            
            <div className="bg-slate-900 p-6 rounded-3xl text-[10px] text-left font-mono text-blue-400 mb-10 overflow-auto max-h-40 border border-white/10 shadow-lg">
               <span className="text-rose-400 font-black">LOG_CRITICAL:</span> {error?.message || "Internal Memory Corrupt"}
               <br/><br/>
               <span className="text-slate-500 italic">TRACE: {error?.stack?.substring(0, 150)}...</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={this.handleReload} 
                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-2xl"
              >
                <LucideRefreshCcw size={20}/> Reiniciar Aplicación
              </button>
              
              <button 
                onClick={this.handleResetApp} 
                className="w-full text-slate-400 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-rose-600 transition-colors flex items-center justify-center gap-2"
              >
                <LucideTrash2 size={14}/> Purgar Base de Datos (Hard Reset)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}