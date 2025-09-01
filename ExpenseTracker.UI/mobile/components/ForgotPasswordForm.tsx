import React, { useEffect, useCallback } from 'react';
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
import { useForgotPassword } from '../hooks/useAuth';
import {
  useFormValidation,
  validateForgotPasswordForm,
} from '../utils/validation';
import { sessionUtils, navigationUtils, debugUtils } from '../utils/auth';
import { useTheme } from '../theme';
import ThemedView from './themed/ThemedView';
import { AuthErrorBoundary } from './AuthErrorBoundary';
import { EmailInput, AuthButton, AuthLink } from './AuthInputs';

interface ForgotPasswordFormData {
  email: string;
}

export const ForgotPasswordForm: React.FC = () => {
  const { theme } = useTheme();
  const { forgotPassword, error, successMessage, isSubmitting, clearMessages } =
    useForgotPassword();

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
  } = useFormValidation<ForgotPasswordFormData>({ email: '' }, (values) =>
    validateForgotPasswordForm(values.email)
  );

  // Load last used email for better UX (only once)
  useEffect(() => {
    const loadLastEmail = async () => {
      const lastEmail = await sessionUtils.getLastEmail();
      if (lastEmail && !values.email) {
        setValue('email', lastEmail);
      }
    };
    loadLastEmail();
  }, []); // Empty dependency array - only run once

  // Clear errors when form values change
  useEffect(() => {
    if (error || successMessage) {
      clearMessages();
    }
  }, [values.email]); // Remove unstable deps

  // Reset form on successful submission
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        resetForm();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, resetForm]);

  const handleForgotPassword = useCallback(async () => {
    debugUtils.logAuthEvent('Forgot password attempt', { email: values.email });

    if (!validateForm()) {
      debugUtils.logAuthEvent('Forgot password validation failed', errors);
      return;
    }

    // Store email for next time
    await sessionUtils.storeLastEmail(values.email);

    const result = await forgotPassword(values.email);

    if (result.success) {
      debugUtils.logAuthEvent('Forgot password successful');
    } else {
      debugUtils.logAuthEvent('Forgot password failed', {
        error: result.error,
      });
    }
  }, [values, validateForm, errors, forgotPassword]);

  const handleBackToSignIn = useCallback(() => {
    navigationUtils.navigateBack('/auth/login');
  }, []);

  const isSubmitDisabled = !isFormValid || isSubmitting;

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
                  Reset Your Password
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Enter your email address and we'll send you a link to reset
                  your password.
                </Text>
              </View>

              <EmailInput
                value={values.email}
                onChangeText={(text) => setValue('email', text)}
                onBlur={() => setFieldTouched('email')}
                error={errors.email}
                touched={touched.email}
                required
                autoFocus
                placeholder="Enter your email address"
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
                title="Send Reset Link"
                onPress={handleForgotPassword}
                disabled={isSubmitDisabled}
                loading={isSubmitting}
                style={styles.submitButton}
                icon="mail-outline"
              />

              <AuthLink
                title="Back to Sign In"
                onPress={handleBackToSignIn}
                disabled={isSubmitting}
                style={styles.backLink}
                textStyle={styles.backLinkText}
              />

              {successMessage && (
                <View style={styles.helpTextContainer}>
                  <Text
                    style={[styles.helpText, { color: theme.textSecondary }]}
                  >
                    Didn't receive the email? Check your spam folder or{' '}
                    <Text
                      style={[styles.helpLinkText, { color: theme.primary }]}
                      onPress={handleForgotPassword}
                    >
                      try again
                    </Text>
                    .
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
  backLink: {
    marginBottom: 16,
  },
  backLinkText: {
    fontSize: 16,
    fontWeight: '500',
  },
  helpTextContainer: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  helpText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  helpLinkText: {
    fontWeight: '500',
  },
});
