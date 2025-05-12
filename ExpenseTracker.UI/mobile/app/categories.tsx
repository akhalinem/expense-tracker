import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { categoriesService } from "~/services/categories";
import { useTheme } from "~/theme";
import ThemedText from "~/components/themed/ThemedText";
import ThemedView from "~/components/themed/ThemedView";
import { FlatList, StyleSheet, Pressable, View } from "react-native";
import ThemedCard from "~/components/themed/ThemedCard";

export default function Categories() {
    const { theme } = useTheme();
    const categoriesWithTransactionsCountQuery = useQuery({
        queryKey: ["categoriesWithTransactionsCount"],
        queryFn: () => categoriesService.getCategoriesWithTransactionCount(),
    });

    const categoriesWithTransactionsCount = categoriesWithTransactionsCountQuery.data || [];
    const isLoading = categoriesWithTransactionsCountQuery.isLoading;
    const isError = categoriesWithTransactionsCountQuery.isError;
    const error = categoriesWithTransactionsCountQuery.error;

    console.log("categoriesWithTransactionsCount:", categoriesWithTransactionsCount);

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

            <ThemedView as={SafeAreaView} style={styles.container}>
                <FlatList
                    data={categoriesWithTransactionsCount}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <ThemedCard
                            as={Pressable}
                            style={styles.categoryItem}
                        >
                            <View style={styles.categoryContent}>
                                <View style={styles.categoryHeader}>
                                    <ThemedText style={styles.categoryName}>{item.name}</ThemedText>
                                    <ThemedView style={styles.countBadge}>
                                        <ThemedText style={styles.countText}>
                                            {item.transactionCount}
                                        </ThemedText>
                                    </ThemedView>
                                </View>
                                <ThemedText style={styles.categoryInfo}>
                                    {item.transactionCount === 0
                                        ? 'No transactions'
                                        : `${item.transactionCount} transaction${item.transactionCount !== 1 ? 's' : ''}`}
                                </ThemedText>
                            </View>
                        </ThemedCard>
                    )}
                    ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
                    contentContainerStyle={styles.listContent}
                />
            </ThemedView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    categoryItem: {
        marginVertical: 4,
    },
    categoryContent: {
        flexDirection: 'column',
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
    categoryInfo: {
        fontSize: 14,
        marginTop: 4,
        opacity: 0.7,
    },
    countBadge: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minWidth: 24,
        alignItems: 'center',
    },
    countText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    separator: {
        height: 1,
        opacity: 0.2,
    }
});