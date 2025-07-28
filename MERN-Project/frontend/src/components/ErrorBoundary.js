import React, { Component } from 'react';
import { logError } from '../utils/errorHandler';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Use our error handling utility
    logError(error, this.props.componentName || 'ErrorBoundary', { 
      componentStack: errorInfo.componentStack,
      componentProps: this.props
    });
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="error-boundary">
          <h2>{this.props.fallbackMessage || 'Something went wrong.'}</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Show error details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button
            className="retry-button"
            onClick={() => {
              if (this.props.onReset) {
                this.props.onReset();
              }
              this.setState({ hasError: false, error: null, errorInfo: null });
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 