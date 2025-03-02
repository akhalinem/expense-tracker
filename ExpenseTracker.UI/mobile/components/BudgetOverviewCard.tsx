import { View, StyleSheet } from "react-native";
import { displayCurrency } from "~/utils";
import ThemedCard from "~/components/themed/ThemedCard";
import ThemedText from "~/components/themed/ThemedText";

interface IBudgetCardProps {
    budget?: number;
    expenses: number;
}

export default function BudgetCard({ budget, expenses }: IBudgetCardProps) {
    return (
        <ThemedCard style={styles.container}>
            {budget ? (
                <View>
                    <ThemedText style={styles.label}>Budget</ThemedText>
                    <ThemedText style={styles.amount}>{displayCurrency(budget)}</ThemedText>
                    <ThemedText variant="secondary" style={styles.remaining}>
                        Remaining: {displayCurrency(budget - expenses)}
                    </ThemedText>
                </View>
            ) : (
                <ThemedText style={styles.noBudget}>No budget set</ThemedText>
            )}
            <View style={styles.expenses}>
                <ThemedText style={styles.label}>Total Expenses</ThemedText>
                <ThemedText style={styles.amount}>{displayCurrency(expenses)}</ThemedText>
            </View>
        </ThemedCard>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 15,
        borderRadius: 10,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
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
    expenses: {
        marginTop: 15,
    },
});
