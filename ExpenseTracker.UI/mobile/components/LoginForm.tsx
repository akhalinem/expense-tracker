import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

// Import our refactored components and utilities
import { useLogin } from '../hooks/useAuth';
import { useFormValidation, validateLoginForm } from '../utils/validation';
import { sessionUtils, navigationUtils, debugUtils } from '../utils/auth';
import { useTheme } from '../theme';
import ThemedView from './themed/ThemedView';
import { AuthErrorBoundary } from './AuthErrorBoundary';
import { EmailInput, PasswordInput, AuthButton, AuthLink } from './AuthInputs';

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginForm: React.FC = () => {
  const { theme } = useTheme();
  const { login, error, isLoading, clearError } = useLogin();
  const hasLoadedEmail = useRef(false);
  const hasShownConfirmation = useRef(false);
  const searchParams = useLocalSearchParams();

  // Show email confirmation message
  useEffect(() => {
    if (hasShownConfirmation.current) return;

    if (searchParams.email_confirmed === 'true') {
      hasShownConfirmation.current = true;
      Alert.alert(
        'Email Confirmed!',
        'Your email has been successfully confirmed. You can now sign in to your account.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  }, [searchParams.email_confirmed]);

  // Form validation using our custom hook
  const {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateForm,
    isFormValid,
  } = useFormValidation<LoginFormData>({ email: '', password: '' }, (values) =>
    validateLoginForm(values.email, values.password)
  );

  // Load last used email for better UX (only once)
  useEffect(() => {
    if (hasLoadedEmail.current) return;

    const loadLastEmail = async () => {
      const lastEmail = await sessionUtils.getLastEmail();
      if (lastEmail && !values.email) {
        setValue('email', lastEmail);
        hasLoadedEmail.current = true;
      }
    };
    loadLastEmail();
  }, []); // Empty dependency array - only run once

  // Clear errors when form values change
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [values.email, values.password]); // Remove clearError from deps

  const handleLogin = useCallback(async () => {
    debugUtils.logAuthEvent('Login attempt', { email: values.email });

    if (!validateForm()) {
      debugUtils.logAuthEvent('Login validation failed', errors);
      return;
    }

    // Store email for next time
    await sessionUtils.storeLastEmail(values.email);

    const result = await login(values.email, values.password);

    if (result.success) {
      debugUtils.logAuthEvent('Login successful');
    } else {
      debugUtils.logAuthEvent('Login failed', { error: result.error });
    }
  }, [values, validateForm, errors, login]);

  const handleForgotPassword = useCallback(() => {
    navigationUtils.navigateToForgotPassword();
  }, []);

  const handleSignUp = useCallback(() => {
    navigationUtils.navigateToRegister();
  }, []);

  const isSubmitDisabled = !isFormValid || isLoading;

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
              />

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={[styles.errorText, { color: theme.error }]}>
                    {error}
                  </Text>
                </View>
              )}

              <AuthButton
                title="Sign In"
                onPress={handleLogin}
                disabled={isSubmitDisabled}
                loading={isLoading}
                style={styles.loginButton}
              />

              <AuthLink
                title="Forgot Password?"
                onPress={handleForgotPassword}
                disabled={isLoading}
                style={styles.forgotPasswordLink}
              />

              <View style={styles.signUpContainer}>
                <Text
                  style={[styles.signUpText, { color: theme.textSecondary }]}
                >
                  Don't have an account?{' '}
                </Text>
                <AuthLink
                  title="Sign Up"
                  onPress={handleSignUp}
                  disabled={isLoading}
                  textStyle={styles.signUpLinkText}
                />
              </View>
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
  errorContainer: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loginButton: {
    marginBottom: 16,
  },
  forgotPasswordLink: {
    marginBottom: 24,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 16,
  },
  signUpLinkText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
