import { View, StyleSheet } from "react-native";
import { IExpense } from "~/types";
import { displayCurrency, displayDate } from "~/utils";
import ThemedCard from "~/components/themed/ThemedCard";
import ThemedText from "~/components/themed/ThemedText";

interface IExpenseCardProps {
    expense: IExpense;
}

export default function ExpenseCard({ expense }: IExpenseCardProps) {
    return (
        <ThemedCard style={styles.container}>
            <View>
                <ThemedText style={styles.amount}>
                    {displayCurrency(expense.amount)}
                </ThemedText>
                <ThemedText variant="secondary" style={styles.description}>
                    {expense.description}
                </ThemedText>
                <View style={styles.metadata}>
                    <View style={styles.categoryContainer}>
                        <ThemedText variant="secondary" style={styles.category}>
                            {expense.category?.name}
                        </ThemedText>
                    </View>
                    <ThemedText variant="secondary" style={styles.date}>
                        {displayDate(expense.createdAt)}
                    </ThemedText>
                </View>
            </View>
        </ThemedCard>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginVertical: 5,
    },
    metadata: {
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
    description: {
        fontSize: 14,
    },
    amount: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    date: {
        fontSize: 12,
    },
    category: {
        fontSize: 12,
        textTransform: 'uppercase',
    },
});
