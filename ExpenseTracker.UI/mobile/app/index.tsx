import { useState } from "react";
import { View, FlatList, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { IBudget, IExpense } from "~/types";
import { displayCurrency, displayDate } from "~/utils";
import { api } from "~/services/api";
import { useCategoriesToggle } from "~/hooks/useCategoriesToggle";
import ThemedView from "~/components/themed/ThemedView";
import ThemedText from "~/components/themed/ThemedText";
import ThemedCard from "~/components/themed/ThemedCard";

export default function HomeScreen() {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const categoriesToggle = useCategoriesToggle();

    const expensesQuery = useQuery({
        queryKey: ['expenses', Array.from(categoriesToggle.selectedCategories)],
        queryFn: async () => {
            const categoryIds = Array.from(categoriesToggle.selectedCategories);
            const response = await api.get<IExpense[]>("/expenses", { params: { categoryIds: categoryIds.join() } });
            return response.data;
        },
        placeholderData: keepPreviousData
    });

    const budgetQuery = useQuery({
        queryKey: ['budgets', 'current'],
        queryFn: async () => {
            const response = await api.get<IBudget>('/budgets/current');
            return response.data
        },
        placeholderData: keepPreviousData
    });

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            expensesQuery.refetch(),
            budgetQuery.refetch(),
            categoriesToggle.categoriesQuery.refetch()
        ]);
        setIsRefreshing(false);
    };

    const isFetching = [expensesQuery, budgetQuery].some(q => q.isFetching);
    const isError = [expensesQuery, budgetQuery].some(q => q.isError) || categoriesToggle.isError;

    if (isError) {
        return (
            <ThemedView style={styles.container}>
                <SafeAreaView style={{ flex: 1 }}>
                    <ThemedText>Error loading data.</ThemedText>
                </SafeAreaView>
            </ThemedView>
        );
    }

    const totalExpenses = (expensesQuery.data ?? []).reduce((acc, expense) => acc + expense.amount, 0);

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                {isFetching && !isRefreshing && <ActivityIndicator size="large" style={styles.loader} />}

                <ThemedCard style={styles.budgetCard}>
                    <ThemedText style={styles.sectionTitle}>Monthly Overview</ThemedText>
                    {budgetQuery.data ? (
                        <View>
                            <ThemedText style={styles.label}>Budget</ThemedText>
                            <ThemedText style={styles.amount}>{displayCurrency(budgetQuery.data.amount)}</ThemedText>
                            <ThemedText variant="secondary" style={styles.remaining}>
                                Remaining: {displayCurrency(budgetQuery.data.amount - totalExpenses)}
                            </ThemedText>
                        </View>
                    ) : (
                        <ThemedText style={styles.noBudget}>No budget set</ThemedText>
                    )}
                    <View style={styles.totalExpenses}>
                        <ThemedText style={styles.label}>Total Expenses</ThemedText>
                        <ThemedText style={styles.amount}>{displayCurrency(totalExpenses)}</ThemedText>
                    </View>
                </ThemedCard>

                <ThemedText style={[styles.sectionTitle, { paddingHorizontal: 15 }]}>Categories</ThemedText>
                <View style={styles.categoriesContainer}>
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesListContainer}
                        data={categoriesToggle.categories}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <Pressable onPress={() => categoriesToggle.toggle(item.id)}>
                                <ThemedCard style={[
                                    styles.categoryItem,
                                    categoriesToggle.selectedCategories.has(item.id) && styles.selectedCategory
                                ]}>
                                    <ThemedText>{item.name}</ThemedText>
                                </ThemedCard>
                            </Pressable>
                        )}
                    />
                </View>

                <ThemedText style={[styles.sectionTitle, { paddingHorizontal: 15 }]}>Recent Expenses</ThemedText>
                <FlatList
                    contentContainerStyle={styles.listContentContainer}
                    data={expensesQuery.data}
                    keyExtractor={(item) => item.id.toString()}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                        />
                    }
                    renderItem={({ item }) => (
                        <ThemedCard style={styles.expenseItem}>
                            <View>
                                <ThemedText style={styles.expenseAmount}>{displayCurrency(item.amount)}</ThemedText>
                                <ThemedText variant="secondary" style={styles.expenseDescription}>{item.description}</ThemedText>
                                <View style={styles.metadataContainer}>
                                    <View style={styles.categoryContainer}>
                                        <ThemedText variant="secondary" style={styles.expenseCategory}>
                                            {item.category}
                                        </ThemedText>
                                    </View>
                                    <ThemedText variant="secondary" style={styles.expenseDate}>
                                        {displayDate(item.createdAt)}
                                    </ThemedText>
                                </View>
                            </View>
                        </ThemedCard>
                    )}
                />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loader: {
        position: 'absolute',
        zIndex: 1,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContentContainer: {
        padding: 20,
        gap: 5
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    expenseItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        marginBottom: 5,
        borderRadius: 8,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    metadataContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 8,
    },
    categoryContainer: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    expenseDescription: {
        fontSize: 14,
    },
    expenseAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    expenseDate: {
        fontSize: 12,
    },
    expenseCategory: {
        fontSize: 12,
        textTransform: 'uppercase',
    },
    budgetCard: {
        padding: 15,
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
        borderRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 5,
    },
    amount: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    remaining: {
        fontSize: 14,
        marginTop: 5,
    },
    noBudget: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    totalExpenses: {
        marginTop: 15,
    },
    categoriesContainer: {
        marginBottom: 10,
    },
    categoriesListContainer: {
        paddingHorizontal: 15,
        paddingVertical: 5,
        gap: 10,
    },
    categoryItem: {
        padding: 10,
        borderWidth: 2,
        borderRadius: 8,
        borderColor: 'transparent',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    selectedCategory: {
        borderColor: '#007AFF',
    },
});
