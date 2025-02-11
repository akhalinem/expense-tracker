import { FC } from "react";
import { Text, View, FlatList, StyleSheet, TextProps, ViewProps } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from "@tanstack/react-query";
import { IBudget, IExpense } from "../types";
import { displayCurrency, displayDate } from "../utils";
import { api } from "../services/api";
import { useTheme } from "../theme";

export const ThemedText: FC<TextProps & { variant?: 'primary' | 'secondary' }> = ({ variant = 'primary', style, ...props }) => {
    const { theme, } = useTheme();
    return <Text style={[{ color: variant === 'primary' ? theme.text : theme.textSecondary }, style]} {...props} />;
}

export const ThemedView: FC<ViewProps> = ({ style, ...props }) => {
    const { theme } = useTheme();
    return <View style={[{ backgroundColor: theme.background }, style]} {...props} />;
}

export const ThemedCard: FC<ViewProps> = ({ style, ...props }) => {
    const { theme } = useTheme();
    return <View style={[{ backgroundColor: theme.card, shadowColor: theme.shadow }, style]} {...props} />;
}


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
            <ThemedView>
                <SafeAreaView style={styles.container}>
                    <ThemedText>Loading...</ThemedText>
                </SafeAreaView>
            </ThemedView>
        );
    }

    if (expensesQuery.isError || budgetQuery.isError) {
        return (
            <ThemedView>
                <SafeAreaView style={styles.container}>
                    <ThemedText>Error loading data.</ThemedText>
                </SafeAreaView>
            </ThemedView>
        );
    }

    const totalExpenses = (expensesQuery.data ?? []).reduce((acc, expense) => acc + expense.amount, 0);

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <ThemedCard style={styles.budgetCard}>
                    <ThemedText style={styles.sectionTitle}>Overview</ThemedText>
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

                <ThemedText style={[styles.sectionTitle, { paddingHorizontal: 15 }]}>Recent Expenses</ThemedText>
                <FlatList
                    contentContainerStyle={styles.listContentContainer}
                    data={expensesQuery.data}
                    keyExtractor={(item) => item.id.toString()}
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
});
