import { FlatList, StyleSheet, Pressable, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CategoryWithTransactionCount } from "~/types";
import { categoriesService } from "~/services/categories";
import { useTheme } from "~/theme";
import ThemedText from "~/components/themed/ThemedText";
import ThemedView from "~/components/themed/ThemedView";
import ThemedCard from "~/components/themed/ThemedCard";

// Helper function to determine text color based on background color brightness
const getContrastTextColor = (hexColor: string): string => {
    // Default to white if no color provided
    if (!hexColor) return '#FFFFFF';

    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Handle shorthand hex (e.g., #FFF)
    const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);

    // Calculate brightness
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Return black for light backgrounds, white for dark backgrounds
    return brightness > 125 ? '#000000' : '#FFFFFF';
};

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
                <FlatList
                    data={categoriesWithTransactionsCount}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <ThemedCard
                            as={Pressable}
                            style={styles.categoryItem}
                            onPress={() => handleEditCategory(item)}
                        >
                            <View style={styles.categoryContent}>
                                <View style={styles.categoryHeader}>
                                    <View style={styles.nameWithColor}>
                                        <View
                                            style={[
                                                styles.colorIndicator,
                                                { backgroundColor: item.color }
                                            ]}
                                        />
                                        <ThemedText style={styles.categoryName}>{item.name}</ThemedText>
                                    </View>
                                </View>
                                <View style={styles.categoryInfoContainer}>
                                    <View
                                        style={[
                                            styles.categoryColorBar,
                                            { backgroundColor: item.color + '33' } // Adding 20% opacity
                                        ]}
                                    >
                                        <ThemedText style={styles.categoryInfo}>
                                            {item.transactionCount === 0
                                                ? 'No transactions'
                                                : `${item.transactionCount} transaction${item.transactionCount !== 1 ? 's' : ''}`}
                                        </ThemedText>
                                    </View>
                                </View>
                            </View>
                        </ThemedCard>
                    )}
                    ItemSeparatorComponent={() => <ThemedView style={styles.separator} />}
                    contentContainerStyle={styles.listContent}
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
    listContent: {
        padding: 16,
    },
    categoryItem: {
        marginVertical: 4,
        overflow: 'hidden', // For the borderLeft to look good
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
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minWidth: 24,
        alignItems: 'center',
        // Add a subtle border to ensure visibility on all backgrounds
        borderWidth: 0.5,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    countText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
        // Color is set dynamically in the component
    },
    separator: {
        height: 1,
        opacity: 0.2,
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
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
    },
    modalView: {
        width: '80%',
        borderRadius: 12,
        padding: 20,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 16
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginBottom: 20
    },
    modalButtons: {
        flexDirection: "row",
        width: '100%',
        justifyContent: "space-between"
    },
    button: {
        borderRadius: 8,
        padding: 12,
        width: '48%',
        alignItems: 'center'
    },
    buttonSave: {
        elevation: 2
    },
    buttonCancel: {
        backgroundColor: 'transparent'
    },
    textStyle: {
        fontWeight: "500"
    },
    saveButtonText: {
        color: 'white',
        fontWeight: "600"
    },
    colorIndicator: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    categoryInfoContainer: {
        marginTop: 8,
    },
    categoryColorBar: {
        borderRadius: 4,
        padding: 6,
    },
    nameWithColor: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});