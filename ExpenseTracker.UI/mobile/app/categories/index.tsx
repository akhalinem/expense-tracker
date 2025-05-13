import { StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CategoryWithTransactionCount } from "~/types";
import { categoriesService } from "~/services/categories";
import { useTheme } from "~/theme";
import ThemedText from "~/components/themed/ThemedText";
import ThemedView from "~/components/themed/ThemedView";
import CategoryList from "~/components/CategoryList";

export default function Categories() {
    const { theme } = useTheme();
    const router = useRouter();

    const categoriesWithTransactionsCountQuery = useQuery({
        queryKey: ["categoriesWithTransactionsCount"],
        queryFn: () => categoriesService.getCategoriesWithTransactionCount(),
    });

    const handleAddCategory = () => {
        router.push("/categories/new");
    };

    const handleEditCategory = (category: CategoryWithTransactionCount) => {
        router.push({
            pathname: "/categories/edit",
            params: {
                id: category.id,
                name: category.name,
                color: category.color,
            }
        });
    };

    const categoriesWithTransactionsCount = categoriesWithTransactionsCountQuery.data || [];
    const isLoading = categoriesWithTransactionsCountQuery.isLoading;
    const isError = categoriesWithTransactionsCountQuery.isError;
    const error = categoriesWithTransactionsCountQuery.error;

    if (isLoading) {
        return (
            <ThemedView as={SafeAreaView} style={{ flex: 1 }}>
                <ThemedText>Loading...</ThemedText>
            </ThemedView>
        );
    }

    if (isError && error) {
        return (
            <ThemedView as={SafeAreaView} style={{ flex: 1 }}>
                <ThemedText>Error: {error.message}</ThemedText>
            </ThemedView>
        );
    }

    if (categoriesWithTransactionsCount.length === 0) {
        return (
            <ThemedView as={SafeAreaView} style={{ flex: 1 }}>
                <ThemedText>No categories found</ThemedText>
            </ThemedView>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    title: "Categories",
                    headerBackTitle: 'Settings',
                }}
            />

            <ThemedView style={styles.container}>
                <CategoryList
                    categories={categoriesWithTransactionsCount}
                    onCategoryPress={handleEditCategory}
                />

                {/* Floating Action Button */}
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: theme.primary }]}
                    onPress={handleAddCategory}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </ThemedView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});