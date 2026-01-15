
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { LucideAlertTriangle, LucideRefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearData = () => {
      if(confirm("¿Está seguro? Esto borrará los datos locales para intentar recuperar la aplicación.")) {
          localStorage.clear();
          window.location.reload();
      }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center border-t-4 border-red-500">
            <div className="mx-auto bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mb-6 text-red-600 animate-pulse">
                <LucideAlertTriangle size={40} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">¡Ups! Algo salió mal</h1>
            <p className="text-slate-600 mb-6 text-sm">
              La aplicación ha encontrado un error inesperado. Hemos registrado el problema.
            </p>
            
            <div className="bg-slate-50 p-3 rounded text-xs text-left font-mono text-red-500 mb-6 overflow-auto max-h-32 border border-slate-200">
                {this.state.error?.message || "Error desconocido"}
            </div>

            <div className="space-y-3">
                <button 
                    onClick={this.handleReload} 
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg"
                >
                    <LucideRefreshCcw size={18}/> Recargar Aplicación
                </button>
                
                <button 
                    onClick={this.handleClearData} 
                    className="w-full bg-white text-slate-500 py-2 rounded-lg font-bold text-xs hover:text-red-600 hover:bg-red-50 transition border border-slate-200"
                >
                    Restablecer datos locales (Si el error persiste)
                </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
