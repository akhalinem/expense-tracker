import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import our refactored components and utilities
import { useResetPassword } from '../hooks/useAuth';
import { AuthErrorBoundary } from './AuthErrorBoundary';
import { PasswordInput, AuthButton, AuthLink } from './AuthInputs';
import {
  useFormValidation,
  validateResetPasswordForm,
} from '../utils/validation';
import { navigationUtils, debugUtils, deepLinkUtils } from '../utils/auth';
import { useTheme } from '../theme';
import ThemedView from './themed/ThemedView';

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

interface ResetPasswordFormProps {
  accessToken?: string;
  refreshToken?: string;
  onCancel?: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  accessToken,
  refreshToken,
  onCancel,
}) => {
  const { theme } = useTheme();
  const { resetPassword, error, successMessage, isSubmitting, clearMessages } =
    useResetPassword();
  const [isValidLink, setIsValidLink] = useState(true);

  // Form validation using our custom hook
  const {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateForm,
    isFormValid,
    resetForm,
  } = useFormValidation<ResetPasswordFormData>(
    { newPassword: '', confirmPassword: '' },
    (values) =>
      validateResetPasswordForm(values.newPassword, values.confirmPassword)
  );

  // Validate reset tokens on mount
  useEffect(() => {
    if (!accessToken || !refreshToken) {
      setIsValidLink(false);
      debugUtils.logAuthEvent('Invalid reset password tokens');
    } else {
      const isValid = deepLinkUtils.validateResetPasswordParams({
        access_token: accessToken,
        refresh_token: refreshToken,
        type: 'recovery',
      });

      if (!isValid) {
        setIsValidLink(false);
        debugUtils.logAuthEvent('Invalid reset password parameters');
      }
    }
  }, [accessToken, refreshToken]);

  // Clear errors when form values change
  useEffect(() => {
    if (error || successMessage) {
      clearMessages();
    }
  }, [values.newPassword, values.confirmPassword]); // Remove clearMessages from deps

  const handleResetPassword = useCallback(async () => {
    if (!isValidLink || !accessToken || !refreshToken) {
      return;
    }

    debugUtils.logAuthEvent('Reset password attempt');

    if (!validateForm()) {
      debugUtils.logAuthEvent('Reset password validation failed', errors);
      return;
    }

    const result = await resetPassword(
      accessToken,
      refreshToken,
      values.newPassword
    );

    if (result.success) {
      debugUtils.logAuthEvent('Reset password successful');
    } else {
      debugUtils.logAuthEvent('Reset password failed', { error: result.error });
    }
  }, [
    isValidLink,
    accessToken,
    refreshToken,
    values,
    validateForm,
    errors,
    resetPassword,
  ]);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      navigationUtils.navigateToSignIn();
    }
  }, [onCancel]);

  const isSubmitDisabled =
    !isFormValid || isSubmitting || !isValidLink || !!successMessage;

  // Show invalid link message
  if (!isValidLink) {
    return (
      <AuthErrorBoundary>
        <ThemedView as={SafeAreaView} style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorTitle, { color: theme.error }]}>
              Invalid Reset Link
            </Text>
            <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>
              This password reset link is invalid or has expired. Please request
              a new password reset.
            </Text>
            <AuthButton
              title="Back to Sign In"
              onPress={handleCancel}
              style={styles.errorButton}
            />
          </View>
        </ThemedView>
      </AuthErrorBoundary>
    );
  }

  return (
    <AuthErrorBoundary>
      <ThemedView as={SafeAreaView} style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <View style={styles.headerContainer}>
                <Text style={[styles.title, { color: theme.text }]}>
                  Set New Password
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Please enter your new password below
                </Text>
              </View>

              <PasswordInput
                value={values.newPassword}
                onChangeText={(text) => setValue('newPassword', text)}
                onBlur={() => setFieldTouched('newPassword')}
                error={errors.newPassword}
                touched={touched.newPassword}
                required
                autoFocus
                label="New Password"
                placeholder="Enter your new password"
                editable={!successMessage}
              />

              <PasswordInput
                value={values.confirmPassword}
                onChangeText={(text) => setValue('confirmPassword', text)}
                onBlur={() => setFieldTouched('confirmPassword')}
                error={errors.confirmPassword}
                touched={touched.confirmPassword}
                required
                label="Confirm New Password"
                placeholder="Confirm your new password"
                editable={!successMessage}
              />

              {error && (
                <View style={styles.messageContainer}>
                  <Text style={[styles.errorText, { color: theme.error }]}>
                    {error}
                  </Text>
                </View>
              )}

              {successMessage && (
                <View style={styles.messageContainer}>
                  <Text
                    style={[
                      styles.successText,
                      { color: theme.success || '#10b981' },
                    ]}
                  >
                    {successMessage}
                  </Text>
                </View>
              )}

              <AuthButton
                title="Update Password"
                onPress={handleResetPassword}
                disabled={isSubmitDisabled}
                loading={isSubmitting}
                style={styles.submitButton}
                icon="key-outline"
              />

              <AuthLink
                title="Cancel"
                onPress={handleCancel}
                disabled={isSubmitting || !!successMessage}
                style={styles.cancelLink}
                textStyle={styles.cancelLinkText}
              />

              {successMessage && (
                <View style={styles.successInfoContainer}>
                  <Text
                    style={[styles.successInfo, { color: theme.textSecondary }]}
                  >
                    Redirecting to login page in a few seconds...
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedView>
    </AuthErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    paddingVertical: 32,
  },
  headerContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  messageContainer: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  submitButton: {
    marginBottom: 24,
  },
  cancelLink: {
    marginBottom: 16,
  },
  cancelLinkText: {
    fontSize: 16,
    fontWeight: '500',
  },
  successInfoContainer: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  successInfo: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  errorButton: {
    minWidth: 200,
  },
});
