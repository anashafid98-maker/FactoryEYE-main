import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 border-2 border-red-200 rounded-lg max-w-2xl mx-auto mt-8">
          <h2 className="text-2xl font-bold text-red-800 mb-4">Erreur dans Equipment</h2>
          <p className="text-red-700 mb-4">
            Le composant s'est écrasé. Vérifiez la console F12.
          </p>
          {this.state.error && (
            <details className="mb-4 p-4 bg-red-100 rounded text-sm">
              <summary>Erreur détaillée</summary>
              <pre className="mt-2 text-xs overflow-auto">{this.state.error.toString()}</pre>
            </details>
          )}
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Recharger la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

