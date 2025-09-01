import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import our refactored components and utilities
import { useRegister } from '../hooks/useAuth';
import {
  useFormValidation,
  validateRegistrationForm,
} from '../utils/validation';
import { sessionUtils, navigationUtils, debugUtils } from '../utils/auth';
import { useTheme } from '../theme';
import ThemedView from './themed/ThemedView';
import { AuthErrorBoundary } from './AuthErrorBoundary';
import { EmailInput, PasswordInput, AuthButton, AuthLink } from './AuthInputs';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export const RegisterForm: React.FC = () => {
  const { theme } = useTheme();
  const { register, error, successMessage, isLoading, clearMessages } =
    useRegister();

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
  } = useFormValidation<RegisterFormData>(
    { email: '', password: '', confirmPassword: '' },
    (values) =>
      validateRegistrationForm(
        values.email,
        values.password,
        values.confirmPassword
      )
  );

  // Clear errors when form values change
  useEffect(() => {
    if (error || successMessage) {
      clearMessages();
    }
  }, [values.email, values.password, values.confirmPassword]); // Remove unstable deps

  // Don't automatically reset form - let user navigate manually for better UX

  const handleRegister = useCallback(async () => {
    debugUtils.logAuthEvent('Registration attempt', { email: values.email });

    if (!validateForm()) {
      debugUtils.logAuthEvent('Registration validation failed', errors);
      return;
    }

    // Store email for next time
    await sessionUtils.storeLastEmail(values.email);

    const result = await register(values.email, values.password);

    if (result.success) {
      debugUtils.logAuthEvent('Registration successful');
    } else {
      debugUtils.logAuthEvent('Registration failed', { error: result.error });
    }
  }, [values, validateForm, errors, register]);

  const handleSignIn = useCallback(() => {
    navigationUtils.navigateToSignIn();
  }, []);

  const isSubmitDisabled = !isFormValid || isLoading;

  return (
    <AuthErrorBoundary>
      <ThemedView as={SafeAreaView} style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.formContainer}>
            {!successMessage ? (
              <>
                <View style={styles.headerContainer}>
                  <Text style={[styles.title, { color: theme.text }]}>
                    Create Account
                  </Text>
                  <Text
                    style={[styles.subtitle, { color: theme.textSecondary }]}
                  >
                    Join us to start tracking your expenses
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
                />

                <PasswordInput
                  value={values.password}
                  onChangeText={(text) => setValue('password', text)}
                  onBlur={() => setFieldTouched('password')}
                  error={errors.password}
                  touched={touched.password}
                  required
                  label="Password"
                  placeholder="Create a secure password"
                  showStrengthIndicator={true}
                  helperText="Password must be at least 6 characters with letters"
                />

                <PasswordInput
                  value={values.confirmPassword}
                  onChangeText={(text) => setValue('confirmPassword', text)}
                  onBlur={() => setFieldTouched('confirmPassword')}
                  error={errors.confirmPassword}
                  touched={touched.confirmPassword}
                  required
                  label="Confirm Password"
                  placeholder="Confirm your password"
                />

                {error && (
                  <View style={styles.messageContainer}>
                    <Text style={[styles.errorText, { color: theme.error }]}>
                      {error}
                    </Text>
                  </View>
                )}

                <AuthButton
                  title="Create Account"
                  onPress={handleRegister}
                  disabled={isSubmitDisabled}
                  loading={isLoading}
                  style={styles.registerButton}
                  icon="person-add-outline"
                />

                <View style={styles.signInContainer}>
                  <Text
                    style={[styles.signInText, { color: theme.textSecondary }]}
                  >
                    Already have an account?{' '}
                  </Text>
                  <AuthLink
                    title="Sign In"
                    onPress={handleSignIn}
                    disabled={isLoading}
                    textStyle={styles.signInLinkText}
                  />
                </View>
              </>
            ) : (
              // Success State
              <View style={styles.successContainer}>
                <View style={styles.successIconContainer}>
                  <Text style={styles.successIcon}>✅</Text>
                </View>
                <Text
                  style={[
                    styles.successTitle,
                    { color: theme.success || '#10b981' },
                  ]}
                >
                  Account Created Successfully!
                </Text>
                <Text
                  style={[styles.successText, { color: theme.textSecondary }]}
                >
                  {successMessage}
                </Text>
                <View style={styles.successActions}>
                  <AuthButton
                    title="Go to Sign In"
                    onPress={handleSignIn}
                    style={styles.successButton}
                    icon="log-in-outline"
                  />
                  <Text
                    style={[styles.helpText, { color: theme.textSecondary }]}
                  >
                    Check your email and click the confirmation link, then sign
                    in to continue.
                  </Text>
                </View>
              </View>
            )}
          </View>
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
  formContainer: {
    // paddingVertical: 32,
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
  successContainer: {
    marginBottom: 24,
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 48,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  successActions: {
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  successButton: {
    marginBottom: 12,
    minWidth: 200,
  },
  helpText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
  registerButton: {
    marginBottom: 24,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 16,
  },
  signInLinkText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
