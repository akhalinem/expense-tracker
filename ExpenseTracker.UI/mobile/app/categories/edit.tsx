import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { categoriesService } from '~/services/categories';
import ThemedText from '~/components/themed/ThemedText';
import ThemedView from '~/components/themed/ThemedView';
import CategoryForm from '~/components/CategoryForm';

export default function EditCategory() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    name: string;
    color: string;
  }>();

  // Fetch the full category data to get all details
  const categoryQuery = useQuery({
    queryKey: ['category', params.id],
    queryFn: () => categoriesService.getCategoryById(Number(params.id)),
    enabled: !!params.id,
  });

  const handleCancel = () => {
    router.back();
  };

  const handleSuccess = () => {
    router.back();
  };

  if (categoryQuery.isLoading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Edit Category' }} />
        <ThemedText style={styles.loadingText}>
          Loading category details...
        </ThemedText>
      </ThemedView>
    );
  }

  // Use URL params as fallback or for initial render
  const categoryName = categoryQuery.data?.name || params.name || '';
  const categoryColor = categoryQuery.data?.color || params.color || '';
  const categoryId = Number(params.id);

  return (
    <ThemedView as={SafeAreaView} edges={['bottom']} style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Edit Category',
          presentation: 'modal',
          headerShown: true,
        }}
      />

      <CategoryForm
        isEdit={true}
        categoryId={categoryId}
        initialName={categoryName}
        initialColor={categoryColor}
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
  loadingText: {
    padding: 16,
    textAlign: 'center',
  },
});
