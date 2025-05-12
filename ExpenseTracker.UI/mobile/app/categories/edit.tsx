import { useState, useEffect } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { categoriesService } from "~/services/categories";
import { useTheme } from "~/theme";
import ThemedText from "~/components/themed/ThemedText";
import ThemedView from "~/components/themed/ThemedView";
import ColorPicker from "~/components/ColorPicker";
import { DEFAULT_CATEGORY_COLOR } from "~/constants";

export default function EditCategory() {
    const { theme } = useTheme();
    const router = useRouter();
    const params = useLocalSearchParams<{ id: string; name: string; color: string }>();
    const queryClient = useQueryClient();
    const [categoryName, setCategoryName] = useState("");
    const [categoryColor, setCategoryColor] = useState(DEFAULT_CATEGORY_COLOR);

    // Fetch the full category data to get the color
    const categoryQuery = useQuery({
        queryKey: ['category', params.id],
        queryFn: () => categoriesService.getCategoryById(Number(params.id)),
        enabled: !!params.id,
    });

    useEffect(() => {
        if (params.name) {
            setCategoryName(params.name);
        }

        setCategoryColor(params.color || DEFAULT_CATEGORY_COLOR);

        // When we have the category data, set the color
        if (categoryQuery.data) {
            setCategoryColor(categoryQuery.data.color || DEFAULT_CATEGORY_COLOR);
        }
    }, [params.id, categoryQuery.data]);

    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, name, color }: { id: number; name: string; color: string }) =>
            categoriesService.updateCategory({ id, name, color }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categoriesWithTransactionsCount"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            router.back();
        }
    });

    const handleCancel = () => {
        router.back();
    };

    const handleSave = () => {
        if (!categoryName.trim() || !params.id) return;
        updateCategoryMutation.mutate({
            id: Number(params.id),
            name: categoryName.trim(),
            color: categoryColor
        });
    };

    if (categoryQuery.isLoading) {
        return (
            <ThemedView style={styles.container}>
                <Stack.Screen options={{ title: "Edit Category" }} />
                <SafeAreaView style={styles.content}>
                    <ThemedText>Loading category details...</ThemedText>
                </SafeAreaView>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen
                options={{
                    title: "Edit Category",
                    presentation: "modal",
                    headerRight: () => (
                        <TouchableOpacity onPress={handleSave}>
                            <ThemedText style={{ color: theme.primary, fontWeight: '600' }}>
                                {updateCategoryMutation.isPending ? 'Saving...' : 'Save'}
                            </ThemedText>
                        </TouchableOpacity>
                    ),
                    headerLeft: () => (
                        <TouchableOpacity onPress={handleCancel}>
                            <ThemedText>Cancel</ThemedText>
                        </TouchableOpacity>
                    ),
                }}
            />

            <SafeAreaView edges={['bottom']} style={styles.content}>
                <ThemedText style={styles.label}>Name</ThemedText>
                <TextInput
                    style={[styles.input, {
                        color: theme.text,
                        borderColor: theme.border,
                        backgroundColor: theme.surface
                    }]}
                    placeholder="Category Name"
                    placeholderTextColor={theme.text + '80'}
                    value={categoryName}
                    onChangeText={setCategoryName}
                    autoFocus
                />

                <ThemedText style={styles.label}>Color</ThemedText>
                <View style={styles.colorPreviewRow}>
                    <View
                        style={[
                            styles.colorPreview,
                            { backgroundColor: categoryColor }
                        ]}
                    />
                    <ThemedText style={styles.colorHex}>{categoryColor}</ThemedText>
                </View>

                <ColorPicker
                    selectedColor={categoryColor}
                    onColorSelected={setCategoryColor}
                />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 16,
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
});
