import { Text, View, FlatList, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { displayCurrency, displayDate } from "../utils";
import { IBudget, IExpense } from "../types";

export default function HomeScreen() {
    const expensesQuery = useQuery({
        queryKey: ['expenses'],
        queryFn: async () => {
            const response = await api.get<IExpense[]>('/expenses');
            return response.data
        },
    });

    const budgetQuery = useQuery({
        queryKey: ['budgets', 'current'],
        queryFn: async () => {
            const response = await api.get<IBudget>('/budgets/current');
            return response.data
        },
    });

    if (expensesQuery.isLoading || budgetQuery.isLoading) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (expensesQuery.isError || budgetQuery.isError) {
        return (
            <View style={styles.container}>
                <Text>Error loading data.</Text>
            </View>
        );
    }

    const totalExpenses = (expensesQuery.data ?? []).reduce((acc, expense) => acc + expense.amount, 0);

    return (
        <View style={styles.container}>
            <View style={styles.budgetCard}>
                <Text style={styles.sectionTitle}>Overview</Text>
                {budgetQuery.data ? (
                    <View>
                        <Text style={styles.label}>Budget</Text>
                        <Text style={styles.amount}>{displayCurrency(budgetQuery.data.amount)}</Text>
                        <Text style={styles.remaining}>
                            Remaining: {displayCurrency(budgetQuery.data.amount - totalExpenses)}
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.noBudget}>No budget set</Text>
                )}
                <View style={styles.totalExpenses}>
                    <Text style={styles.label}>Total Expenses</Text>
                    <Text style={styles.amount}>{displayCurrency(totalExpenses)}</Text>
                </View>
            </View>

            <Text style={[styles.sectionTitle, { paddingHorizontal: 15 }]}>Recent Expenses</Text>
            <FlatList
                contentContainerStyle={styles.listContentContainer}
                data={expensesQuery.data}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.expenseItem}>
                        <View>
                            <Text style={styles.expenseName}>{item.name}</Text>
                            <Text style={styles.expenseDate}>{displayDate(item.createdAt)}</Text>
                            <Text style={styles.expenseCategory}>{item.category}</Text>
                        </View>
                        <Text style={styles.expenseAmount}>{displayCurrency(item.amount)}</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
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
        padding: 10,
        marginBottom: 5,
        backgroundColor: '#fff',
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    expenseName: {
        fontSize: 16,
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    expenseDate: {
        fontSize: 14,
        color: 'gray',
    },
    expenseCategory: {
        fontSize: 14,
        color: 'gray',
    },
    budgetCard: {
        backgroundColor: '#fff',
        padding: 15,
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
        borderRadius: 10,
        shadowColor: '#000',
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
        color: 'gray',
        marginTop: 5,
    },
    noBudget: {
        fontSize: 14,
        color: 'gray',
        fontStyle: 'italic',
    },
    totalExpenses: {
        marginTop: 15,
    },
});
