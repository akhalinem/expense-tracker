import { Text, View, FlatList } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export default function HomeScreen() {
    const expensesQuery = useQuery({
        queryKey: ['expenses'],
        queryFn: async () => {
            const response = await api.get('/expenses');
            console.log({ response })
            return response.data
        },
    });

    if (expensesQuery.isLoading) {
        return (
            <View>
                <Text>Loading expenses...</Text>
            </View>
        );
    }

    if (expensesQuery.isError) {
        return (
            <View>
                <Text>Error loading expenses.</Text>
            </View>
        );
    }

    return (
        <View>
            <Text>Home Screen</Text>
            <FlatList
                data={expensesQuery.data}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Text>{item.description} - {item.amount}</Text>
                )}
            />
        </View>
    );
}
