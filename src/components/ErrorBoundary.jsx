import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { createAuditLog } from '../services/auditService';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Log to audit
    try {
      createAuditLog(
        'ERROR',
        'app',
        null,
        null,
        {
          error: error.toString(),
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString()
        }
      );
    } catch (auditError) {
      console.error('Failed to log error to audit:', auditError);
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <AlertCircle size={64} color="#DC2626" />
            
            <h1>Oops! Something went wrong</h1>
            
            <p className="error-message">
              We encountered an unexpected error. Please try refreshing the page.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="error-details">
                <h3>Error Details (Development Only):</h3>
                <pre className="error-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <div className="error-actions">
              <button onClick={this.handleReload} className="btn-reload">
                <RefreshCw size={20} />
                Reload Page
              </button>
              
              <button onClick={this.handleGoHome} className="btn-home">
                <Home size={20} />
                Go to Dashboard
              </button>
            </div>

            <p className="error-help-text">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
