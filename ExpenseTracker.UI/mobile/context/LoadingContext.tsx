import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

/**
 * Loading state management for authentication operations
 */

export interface LoadingState {
  [key: string]: boolean;
}

export interface LoadingContextValue {
  loadingStates: LoadingState;
  setLoading: (key: string, isLoading: boolean) => void;
  isLoading: (key: string) => boolean;
  isAnyLoading: () => boolean;
  clearAllLoading: () => void;
}

type LoadingAction =
  | { type: 'SET_LOADING'; key: string; isLoading: boolean }
  | { type: 'CLEAR_ALL' };

const loadingReducer = (
  state: LoadingState,
  action: LoadingAction
): LoadingState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        [action.key]: action.isLoading,
      };
    case 'CLEAR_ALL':
      return {};
    default:
      return state;
  }
};

const LoadingContext = createContext<LoadingContextValue | undefined>(
  undefined
);

/**
 * Loading state provider component
 */
export const LoadingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [loadingStates, dispatch] = useReducer(loadingReducer, {});

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    dispatch({ type: 'SET_LOADING', key, isLoading });
  }, []);

  const isLoading = useCallback(
    (key: string) => {
      return Boolean(loadingStates[key]);
    },
    [loadingStates]
  );

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const clearAllLoading = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  const value: LoadingContextValue = {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    clearAllLoading,
  };

  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
};

/**
 * Hook to use loading state management
 */
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

/**
 * Pre-defined loading keys for authentication operations
 */
export const LOADING_KEYS = {
  LOGIN: 'auth.login',
  REGISTER: 'auth.register',
  FORGOT_PASSWORD: 'auth.forgotPassword',
  RESET_PASSWORD: 'auth.resetPassword',
  LOGOUT: 'auth.logout',
  SESSION_RESTORE: 'auth.sessionRestore',
  TOKEN_REFRESH: 'auth.tokenRefresh',
} as const;

/**
 * Custom hook for specific authentication loading states
 */
export const useAuthLoading = () => {
  const { setLoading, isLoading, isAnyLoading } = useLoading();

  return {
    // Individual loading states
    isLoginLoading: isLoading(LOADING_KEYS.LOGIN),
    isRegisterLoading: isLoading(LOADING_KEYS.REGISTER),
    isForgotPasswordLoading: isLoading(LOADING_KEYS.FORGOT_PASSWORD),
    isResetPasswordLoading: isLoading(LOADING_KEYS.RESET_PASSWORD),
    isLogoutLoading: isLoading(LOADING_KEYS.LOGOUT),
    isSessionRestoreLoading: isLoading(LOADING_KEYS.SESSION_RESTORE),
    isTokenRefreshLoading: isLoading(LOADING_KEYS.TOKEN_REFRESH),

    // Check if any auth operation is loading
    isAnyAuthLoading: () => {
      return Object.values(LOADING_KEYS).some((key) => isLoading(key));
    },

    // Setters for individual operations
    setLoginLoading: (loading: boolean) =>
      setLoading(LOADING_KEYS.LOGIN, loading),
    setRegisterLoading: (loading: boolean) =>
      setLoading(LOADING_KEYS.REGISTER, loading),
    setForgotPasswordLoading: (loading: boolean) =>
      setLoading(LOADING_KEYS.FORGOT_PASSWORD, loading),
    setResetPasswordLoading: (loading: boolean) =>
      setLoading(LOADING_KEYS.RESET_PASSWORD, loading),
    setLogoutLoading: (loading: boolean) =>
      setLoading(LOADING_KEYS.LOGOUT, loading),
    setSessionRestoreLoading: (loading: boolean) =>
      setLoading(LOADING_KEYS.SESSION_RESTORE, loading),
    setTokenRefreshLoading: (loading: boolean) =>
      setLoading(LOADING_KEYS.TOKEN_REFRESH, loading),

    // Global loading state
    isAnyLoading,
  };
};

/**
 * Higher-order component to wrap components with loading state
 */
export const withLoadingState = <P extends object>(
  Component: React.ComponentType<P>,
  loadingKey: string
) => {
  const WrappedComponent: React.FC<P & { isLoading?: boolean }> = (props) => {
    const { setLoading, isLoading } = useLoading();

    React.useEffect(() => {
      if (props.isLoading !== undefined) {
        setLoading(loadingKey, props.isLoading);
      }
    }, [props.isLoading, setLoading]);

    return <Component {...props} isLoading={isLoading(loadingKey)} />;
  };

  WrappedComponent.displayName = `withLoadingState(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

/**
 * Hook for async operations with automatic loading state management
 */
export const useAsyncOperation = <T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  loadingKey: string
) => {
  const { setLoading, isLoading } = useLoading();
  const [error, setError] = React.useState<Error | null>(null);
  const [data, setData] = React.useState<R | null>(null);

  const execute = useCallback(
    async (...args: T): Promise<R> => {
      try {
        setError(null);
        setLoading(loadingKey, true);

        const result = await operation(...args);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setLoading(loadingKey, false);
      }
    },
    [operation, loadingKey, setLoading]
  );

  const reset = useCallback(() => {
    setError(null);
    setData(null);
    setLoading(loadingKey, false);
  }, [loadingKey, setLoading]);

  return {
    execute,
    data,
    error,
    isLoading: isLoading(loadingKey),
    reset,
  };
};

/**
 * Global loading indicator component
 */
export interface GlobalLoadingIndicatorProps {
  excludeKeys?: string[];
  style?: any;
}

export const GlobalLoadingIndicator: React.FC<GlobalLoadingIndicatorProps> = ({
  excludeKeys = [],
  style,
}) => {
  const { loadingStates } = useLoading();

  const isLoading = Object.entries(loadingStates).some(
    ([key, loading]) => loading && !excludeKeys.includes(key)
  );

  if (!isLoading) return null;

  return (
    <View style={[defaultStyles.overlay, style]}>
      <View style={defaultStyles.indicator}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={defaultStyles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
};

const defaultStyles = {
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 9999,
  },
  indicator: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center' as const,
    minWidth: 120,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
};
