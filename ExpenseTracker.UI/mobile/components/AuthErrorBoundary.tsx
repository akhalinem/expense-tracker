import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '~/theme';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component for authentication flows
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 */
class AuthErrorBoundaryClass extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AuthErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-reset after 10 seconds for better UX
    this.resetTimeoutId = window.setTimeout(() => {
      this.resetErrorBoundary();
    }, 10000);
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetOnPropsChange) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      // Default fallback UI
      return (
        <AuthErrorFallback
          error={this.state.error}
          onRetry={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default fallback component when an error occurs
 */
const AuthErrorFallback: React.FC<{
  error: Error | null;
  onRetry: () => void;
}> = ({ error, onRetry }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          Something went wrong
        </Text>

        <Text style={[styles.message, { color: theme.textSecondary }]}>
          An unexpected error occurred. Please try again.
        </Text>

        {__DEV__ && error && (
          <Text style={[styles.errorDetails, { color: theme.error }]}>
            {error.message}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={onRetry}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>

        <Text style={[styles.autoResetText, { color: theme.textSecondary }]}>
          This will automatically reset in a few seconds
        </Text>
      </View>
    </View>
  );
};

/**
 * Higher-order component wrapper for functional components
 */
export const withAuthErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <AuthErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </AuthErrorBoundary>
  );

  WrappedComponent.displayName = `withAuthErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

/**
 * Main Error Boundary component export
 */
export const AuthErrorBoundary: React.FC<Props> = (props) => {
  return <AuthErrorBoundaryClass {...props} />;
};

/**
 * Custom hook for error boundary integration
 * Provides error reporting and reset functionality
 */
export const useErrorHandler = () => {
  const handleError = React.useCallback(
    (error: Error, errorInfo?: ErrorInfo) => {
      // Log error for debugging
      console.error('Auth Error:', error);

      if (errorInfo) {
        console.error('Error Info:', errorInfo);
      }

      // Here you could integrate with error reporting services like Sentry
      // Sentry.captureException(error, { extra: errorInfo });
    },
    []
  );

  const createErrorBoundaryProps = React.useCallback(
    (resetKeys?: Array<string | number>): Omit<Props, 'children'> => ({
      onError: handleError,
      resetKeys,
      resetOnPropsChange: true,
    }),
    [handleError]
  );

  return {
    handleError,
    createErrorBoundaryProps,
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorDetails: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'monospace',
    padding: 12,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  autoResetText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
