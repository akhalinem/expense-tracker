import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useTheme } from '~/theme';
import { ForgotPasswordForm } from '~/components/ForgotPasswordForm';

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ForgotPasswordForm />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
