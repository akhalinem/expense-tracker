import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RegisterForm } from '~/components/RegisterForm';
import ThemedView from '~/components/themed/ThemedView';

export default function RegisterScreen() {
  return (
    <ThemedView as={SafeAreaView} style={styles.container}>
      <RegisterForm />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
