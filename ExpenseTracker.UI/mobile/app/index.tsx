import { Text, View, FlatList, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { displayCurrency, displayDate } from "../utils";
import { IExpense } from "../types";

export default function HomeScreen() {
    const expensesQuery = useQuery({
        queryKey: ['expenses'],
        queryFn: async () => {
            const response = await api.get<IExpense[]>('/expenses');
            console.log({ response })
            return response.data
        },
    });

    if (expensesQuery.isLoading) {
        return (
            <View style={styles.container}>
                <Text>Loading expenses...</Text>
            </View>
        );
    }

    if (expensesQuery.isError) {
        return (
            <View style={styles.container}>
                <Text>Error loading expenses.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
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
});
