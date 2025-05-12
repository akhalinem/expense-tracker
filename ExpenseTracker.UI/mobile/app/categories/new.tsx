import { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesService } from "~/services/categories";
import { useTheme } from "~/theme";
import ThemedText from "~/components/themed/ThemedText";
import ThemedView from "~/components/themed/ThemedView";

export default function NewCategory() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { theme } = useTheme();
    const [categoryName, setCategoryName] = useState("");

    const createCategoryMutation = useMutation({
        mutationFn: (name: string) => categoriesService.createCategory({ name }),
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
        createCategoryMutation.mutate(categoryName.trim());
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
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
        fontSize: 16,
    },
});
