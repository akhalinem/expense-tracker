import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesService } from "~/services/categories";
import { useTheme } from "~/theme";
import ThemedText from "~/components/themed/ThemedText";
import ThemedView from "~/components/themed/ThemedView";
import ColorPicker from "~/components/ColorPicker";
import { DEFAULT_CATEGORY_COLOR } from "~/constants";

export default function NewCategory() {
    const { theme } = useTheme();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [categoryName, setCategoryName] = useState("");
    const [categoryColor, setCategoryColor] = useState(DEFAULT_CATEGORY_COLOR);

    const createCategoryMutation = useMutation({
        mutationFn: ({ name, color }: { name: string; color: string }) =>
            categoriesService.createCategory({ name, color }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categoriesWithTransactionsCount"] });
            router.back();
        }
    });

    const handleCancel = () => {
        router.back();
    };

    const handleSave = () => {
        if (!categoryName.trim()) return;
        createCategoryMutation.mutate({
            name: categoryName.trim(),
            color: categoryColor
        });
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen
                options={{
                    title: "New Category",
                    presentation: "modal",
                    headerRight: () => (
                        <TouchableOpacity onPress={handleSave}>
                            <ThemedText style={{ color: theme.primary, fontWeight: '600' }}>
                                {createCategoryMutation.isPending ? 'Saving...' : 'Save'}
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
