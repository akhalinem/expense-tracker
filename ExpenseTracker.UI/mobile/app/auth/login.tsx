import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginForm } from '~/components/LoginForm';
import ThemedView from '~/components/themed/ThemedView';

export default function LoginScreen() {
  return (
    <ThemedView as={SafeAreaView} style={styles.container}>
      <LoginForm />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
