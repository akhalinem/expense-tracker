import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import ThemedView from '~/components/themed/ThemedView';
import CategoryForm from '~/components/CategoryForm';

export default function NewCategory() {
  const router = useRouter();

  const handleCancel = () => {
    router.back();
  };

  const handleSuccess = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'New Category',
          presentation: 'modal',
          headerShown: true,
        }}
      />

      <CategoryForm
        isEdit={false}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
