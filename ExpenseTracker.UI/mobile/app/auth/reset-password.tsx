import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  useRouter,
  useLocalSearchParams,
  useGlobalSearchParams,
} from 'expo-router';
import { useTheme } from '~/theme';
import { useResetPassword } from '~/hooks/useAuth';

export default function ResetPasswordScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const {
    resetPassword,
    error: hookError,
    successMessage,
    isSubmitting,
    clearMessages,
  } = useResetPassword();
  const params = useLocalSearchParams();
  const globalParams = useGlobalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  // Extract tokens from route parameters (coming from backend redirect)
  const accessToken = (params.access_token ||
    globalParams.access_token) as string;
  const refreshToken = (params.refresh_token ||
    globalParams.refresh_token) as string;
  const type = (params.type || globalParams.type) as string;
  const validated = (params.validated || globalParams.validated) as string;

  // Extract error parameters from backend redirect
  const redirectError = (params.error || globalParams.error) as string;
  const redirectErrorDescription = (params.error_description ||
    globalParams.error_description) as string;

  const isValidResetLink = useMemo(() => {
    // If there's a redirect error, the link is invalid
    if (redirectError) {
      return false;
    }
    // Be more strict: require ALL necessary parameters and explicit validation
    const hasRequiredTokens = accessToken && refreshToken;
    const isExplicitlyValidated = validated === 'true';
    const hasValidType = type === 'recovery' || type === 'signup';

    // Only allow if we have explicit validation from backend
    return hasRequiredTokens && isExplicitlyValidated && hasValidType;
  }, [accessToken, refreshToken, type, redirectError, validated]);

  const isDisabled = useMemo(() => {
    return (
      isSubmitting ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !isValidResetLink
    );
  }, [isSubmitting, password, confirmPassword, isValidResetLink]);

  const inputStyle = useMemo(
    () => [styles.input, { borderColor: theme.border, color: theme.text }],
    [theme.border, theme.text]
  );

  const buttonStyle = useMemo(
    () => [
      styles.button,
      { backgroundColor: isDisabled ? theme.textSecondary : theme.primary },
    ],
    [isDisabled, theme.textSecondary, theme.primary]
  );

  const errorStyle = useMemo(
    () => [styles.error, { color: theme.error }],
    [theme.error]
  );

  // Combined error from validation or hook
  const displayError = validationError || hookError;

  useEffect(() => {
    if (!isValidResetLink) {
      let errorMessage =
        'Invalid or expired reset link. Please request a new password reset.';

      if (redirectError) {
        // Handle backend redirect errors with specific messages
        switch (redirectError) {
          case 'invalid_request':
            errorMessage =
              redirectErrorDescription ||
              'The reset link appears to be invalid.';
            break;
          case 'server_error':
            errorMessage =
              'A server error occurred while processing your reset link. Please try again.';
            break;
          case 'session_invalid':
            errorMessage =
              redirectErrorDescription ||
              'This reset link has expired or is invalid. Please request a new password reset.';
            break;
          case 'processing_error':
            errorMessage =
              'There was an error processing your reset link. Please try again or request a new one.';
            break;
          default:
            errorMessage =
              redirectErrorDescription ||
              'An error occurred while processing your reset link.';
        }
      } else if (!accessToken && !refreshToken) {
        errorMessage =
          'No reset tokens found. Please click the reset link from your email again.';
      } else if (!validated || validated !== 'true') {
        errorMessage =
          'This reset link has not been validated. Please click the reset link from your email to verify it.';
      } else if (!accessToken) {
        errorMessage =
          'Access token missing from reset link. Please request a new password reset.';
      } else if (!refreshToken) {
        errorMessage =
          'Refresh token missing from reset link. Please request a new password reset.';
      }

      setValidationError(errorMessage);
    }
  }, [
    isValidResetLink,
    params,
    globalParams,
    accessToken,
    refreshToken,
    type,
    validated,
    redirectError,
    redirectErrorDescription,
  ]);

  const handlePasswordReset = async () => {
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long');
      return;
    }

    setValidationError('');
    clearMessages();

    await resetPassword(accessToken, refreshToken, password);
  };

  if (!isValidResetLink) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>
            Invalid Reset Link
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {validationError ||
              'This password reset link is invalid or has expired. Please request a new password reset.'}
          </Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={() => router.replace('/auth/forgot-password')}
          >
            <Text style={styles.buttonText}>Request New Reset Link</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/auth/login')}
          >
            <Text style={[styles.backButtonText, { color: theme.primary }]}>
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          Set New Password
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Enter your new password below.
        </Text>

        <TextInput
          style={inputStyle}
          placeholder="New Password"
          placeholderTextColor={theme.textSecondary}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (validationError) setValidationError('');
            if (hookError) clearMessages();
          }}
          secureTextEntry
          autoCapitalize="none"
        />

        <TextInput
          style={inputStyle}
          placeholder="Confirm New Password"
          placeholderTextColor={theme.textSecondary}
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (validationError) setValidationError('');
            if (hookError) clearMessages();
          }}
          secureTextEntry
          autoCapitalize="none"
        />

        {displayError ? <Text style={errorStyle}>{displayError}</Text> : null}
        {successMessage ? (
          <Text style={[styles.success, { color: theme.success || '#10b981' }]}>
            {successMessage}
          </Text>
        ) : null}

        <TouchableOpacity
          style={buttonStyle}
          onPress={handlePasswordReset}
          disabled={isDisabled || !!successMessage}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Update Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/auth/login')}
          disabled={isSubmitting ? true : false}
        >
          <Text style={[styles.backButtonText, { color: theme.primary }]}>
            Back to Sign In
          </Text>
        </TouchableOpacity>
      </View>
      {/* Disable password fields after success */}
      {successMessage ? (
        <Text
          style={{
            textAlign: 'center',
            marginTop: 16,
            color: theme.textSecondary,
          }}
        >
          You can now sign in with your new password.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  error: {
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  success: {
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
