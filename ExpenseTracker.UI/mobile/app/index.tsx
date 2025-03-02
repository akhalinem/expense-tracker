import { useState, useRef, useCallback } from "react";
import { View, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IExpense } from "~/types";
import { expensesService } from "~/services/expenses";
import { budgetsService } from "~/services/budgets";
import { useCategoriesToggle } from "~/hooks/useCategoriesToggle";
import ThemedView from "~/components/themed/ThemedView";
import ThemedText from "~/components/themed/ThemedText";
import SaveExpenseSheet from "~/components/SaveExpenseSheet";
import ExpenseCard from "~/components/ExpenseCard";
import BudgetCard from "~/components/BudgetOverviewCard";
import CategoryPicker from '~/components/CategoryPicker';

export default function HomeScreen() {
    const queryClient = useQueryClient();
    const categoriesToggle = useCategoriesToggle({ multiple: true });

    const bottomSheetRef = useRef<BottomSheetModal<IExpense | null>>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const expensesQuery = useQuery({
        queryKey: ['expenses', Array.from(categoriesToggle.selected)],
        queryFn: () => expensesService.getExpenses(Array.from(categoriesToggle.selected)),
        placeholderData: keepPreviousData
    });

    const budgetQuery = useQuery({
        queryKey: ['budgets', 'current'],
        queryFn: budgetsService.getCurrentBudget,
        placeholderData: keepPreviousData
    });

    const deleteExpenseMutation = useMutation({
        mutationFn: expensesService.deleteExpense,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
        },
        onError: (error) => {
            Alert.alert("Error", "Failed to delete the expense: " + error.message);
        }
    });

    const handleDelete = (expenseId: number) => {
        Alert.alert(
            "Delete Expense",
            "Are you sure you want to delete this expense?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteExpenseMutation.mutate(expenseId)
                }
            ]
        );
    };

    const handleEdit = (expense: IExpense) => {
        bottomSheetRef.current?.present(expense);
    };

    const renderRightActions = (expense: IExpense) => {
        return (
            <View style={styles.expenseRightActionsContainer}>
                <TouchableOpacity
                    style={styles.editAction}
                    onPress={() => handleEdit(expense)}
                >
                    <Ionicons name="create-outline" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteAction}
                    onPress={() => handleDelete(expense.id)}
                >
                    <Ionicons name="trash-outline" size={24} color="white" />
                </TouchableOpacity>
            </View>
        );
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            expensesQuery.refetch(),
            budgetQuery.refetch(),
            categoriesToggle.refetch()
        ]);
        setIsRefreshing(false);
    };

    const handlePresentModal = useCallback(() => {
        bottomSheetRef.current?.present();
    }, []);

    const isFetching = [expensesQuery, budgetQuery].some(q => q.isFetching);
    const isError = [expensesQuery, budgetQuery].some(q => q.isError) || categoriesToggle.isError;

    if (isError) {
        return (
            <ThemedView style={styles.container}>
                <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} >
                    <ThemedText>Error loading data.</ThemedText>
                </SafeAreaView>
            </ThemedView >
        );
    }

    const totalExpenses = (expensesQuery.data ?? []).reduce((acc, expense) => acc + expense.amount, 0);

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {(isFetching || deleteExpenseMutation.isPending) && !isRefreshing && <ActivityIndicator size="large" style={styles.loader} />}

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Monthly Overview</ThemedText>
                    <BudgetCard
                        budget={budgetQuery.data?.amount}
                        expenses={totalExpenses}
                    />
                </View>

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Categories</ThemedText>
                    <CategoryPicker
                        categoriesToggle={categoriesToggle}
                    />
                </View>

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Recent Expenses</ThemedText>
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
                            <ReanimatedSwipeable
                                renderRightActions={() => renderRightActions(item)}
                                rightThreshold={80}
                            >
                                <ExpenseCard expense={item} />
                            </ReanimatedSwipeable>
                        )}
                    />
                </View>

                <TouchableOpacity
                    style={styles.fab}
                    onPress={handlePresentModal}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>

                <SaveExpenseSheet bottomSheetRef={bottomSheetRef} />
            </SafeAreaView>
        </ThemedView >
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
        paddingBottom: 25
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    section: {
        marginTop: 10,
        marginBottom: 10,
        paddingHorizontal: 15
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    expenseRightActionsContainer: {
        flexDirection: 'row',
        marginRight: 15,
        marginLeft: -30,
        marginVertical: 5,
        gap: 8,
    },
    deleteAction: {
        backgroundColor: '#ef4444',
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        height: '100%',
        borderRadius: 8,
    },
    editAction: {
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        height: '100%',
        borderRadius: 8,
    },
});
