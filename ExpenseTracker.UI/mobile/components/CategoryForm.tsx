import { useState, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_CATEGORY_COLOR } from '~/constants';
import { categoriesService } from '~/services/categories';
import { queryInvalidationService } from '~/services/queryInvalidation';
import { useTheme } from '~/theme';
import ThemedText from '~/components/themed/ThemedText';
import ColorPicker from '~/components/ColorPicker';
import { KeyboardDismissing } from '~/components/KeyboardDismissing';

type CategoryFormProps = {
  isEdit: boolean;
  categoryId?: number;
  initialName?: string;
  initialColor?: string;
  onCancel: () => void;
  onSuccess: () => void;
};

export default function CategoryForm({
  isEdit,
  categoryId,
  initialName = '',
  initialColor = DEFAULT_CATEGORY_COLOR,
  onCancel,
  onSuccess,
}: CategoryFormProps) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [categoryName, setCategoryName] = useState(initialName);
  const [categoryColor, setCategoryColor] = useState(initialColor);

  useEffect(() => {
    setCategoryName(initialName);
    setCategoryColor(initialColor || DEFAULT_CATEGORY_COLOR);
  }, [initialName, initialColor]);

  const createCategoryMutation = useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      categoriesService.createCategory({ name, color }),
    onSuccess: async () => {
      await queryInvalidationService.invalidateCategories();
      onSuccess();
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({
      id,
      name,
      color,
    }: {
      id: number;
      name: string;
      color: string;
    }) => categoriesService.updateCategory({ id, name, color }),
    onSuccess: async () => {
      // Category updates can affect transaction display, so invalidate both
      await Promise.all([
        queryInvalidationService.invalidateCategories(),
        queryInvalidationService.invalidateTransactions(),
      ]);
      onSuccess();
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => categoriesService.deleteCategory(id),
    onSuccess: async () => {
      await queryInvalidationService.invalidateCategories();
      onSuccess();
    },
    onError: (error) => {
      Alert.alert(
        'Delete Failed',
        error.message ||
          'This category has linked transactions and cannot be deleted. Unlink the transactions first.'
      );
    },
  });

  const handleSave = () => {
    if (!categoryName.trim()) return;

    if (isEdit && categoryId) {
      updateCategoryMutation.mutate({
        id: categoryId,
        name: categoryName.trim(),
        color: categoryColor,
      });
    } else {
      createCategoryMutation.mutate({
        name: categoryName.trim(),
        color: categoryColor,
      });
    }
  };

  const handleDelete = () => {
    if (!isEdit || !categoryId) return;

    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCategoryMutation.mutate(categoryId);
          },
        },
      ]
    );
  };

  const isPending =
    createCategoryMutation.isPending ||
    updateCategoryMutation.isPending ||
    deleteCategoryMutation.isPending;

  return (
    <KeyboardDismissing>
      <View style={styles.content}>
        <View style={styles.section}>
          <ThemedText style={styles.label}>Name</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.surface,
              },
            ]}
            placeholder="Category Name"
            placeholderTextColor={theme.text + '80'}
            value={categoryName}
            onChangeText={setCategoryName}
            autoFocus
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.label}>Color</ThemedText>
          <View style={styles.colorPreviewRow}>
            <View
              style={[styles.colorPreview, { backgroundColor: categoryColor }]}
            />
            <ThemedText style={styles.colorHex}>{categoryColor}</ThemedText>
          </View>
        </View>

        <ColorPicker
          selectedColor={categoryColor}
          onColorSelected={setCategoryColor}
        />

        <View style={styles.section}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { borderColor: theme.border },
              ]}
              onPress={onCancel}
              disabled={isPending}
            >
              <ThemedText>Cancel</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={handleSave}
              disabled={isPending || !categoryName.trim()}
            >
              <ThemedText style={styles.saveButtonText}>
                {isPending ? 'Saving...' : 'Save'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {isEdit && (
          <View style={styles.section}>
            <View style={styles.deleteButtonContainer}>
              <ThemedText style={styles.warningText}>
                Note: Categories with linked transactions cannot be deleted.
              </ThemedText>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                disabled={deleteCategoryMutation.isPending}
              >
                <ThemedText style={styles.deleteButtonText}>
                  {deleteCategoryMutation.isPending
                    ? 'Deleting...'
                    : 'Delete Category'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </KeyboardDismissing>
  );
}

const styles = StyleSheet.create({
  content: {
    // flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  colorPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  colorHex: {
    fontSize: 14,
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    elevation: 2,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  deleteButtonContainer: {
    marginTop: 24,
  },
  warningText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 16,
  },
});
