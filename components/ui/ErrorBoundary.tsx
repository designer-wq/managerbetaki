import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });

        // Log error to console in development
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Call optional error handler
        this.props.onError?.(error, errorInfo);

        // Could send to error tracking service here
        // logErrorToService(error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
                    <div className="card-enterprise max-w-lg w-full p-8 text-center">
                        {/* Error Icon */}
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                            <AlertTriangle size={32} className="text-red-500" />
                        </div>

                        {/* Title */}
                        <h1 className="text-xl font-semibold text-white mb-2">
                            Ops! Algo deu errado
                        </h1>
                        <p className="text-zinc-400 mb-6">
                            Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
                        </p>

                        {/* Error Details (collapsible in production) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-400 flex items-center gap-2">
                                    <Bug size={14} />
                                    Detalhes técnicos
                                </summary>
                                <div className="mt-3 p-3 bg-zinc-900 rounded-lg overflow-auto max-h-40">
                                    <p className="text-xs text-red-400 font-mono break-all">
                                        {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo && (
                                        <pre className="mt-2 text-xs text-zinc-500 font-mono whitespace-pre-wrap">
                                            {this.state.errorInfo.componentStack}
                                        </pre>
                                    )}
                                </div>
                            </details>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-zinc-900 font-medium rounded-lg hover:bg-primary-hover transition-colors"
                            >
                                <RefreshCw size={16} />
                                Tentar novamente
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors"
                            >
                                <Home size={16} />
                                Ir para o início
                            </button>
                        </div>

                        {/* Support Info */}
                        <p className="mt-6 text-xs text-zinc-600">
                            Se o problema persistir, entre em contato com o suporte.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook for functional components to trigger error boundary
export const useErrorHandler = () => {
    const [, setError] = React.useState();

    return React.useCallback((error: Error) => {
        setError(() => {
            throw error;
        });
    }, []);
};

export default ErrorBoundary;
