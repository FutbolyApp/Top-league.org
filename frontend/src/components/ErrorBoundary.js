import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          margin: '1rem'
        }}>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>
            ⚠️ Qualcosa è andato storto
          </h2>
          <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
            Si è verificato un errore imprevisto. Riprova a ricaricare la pagina.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Ricarica Pagina
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '1rem', textAlign: 'left' }}>
              <summary>Dettagli errore (solo sviluppo)</summary>
              <pre style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.8rem'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;