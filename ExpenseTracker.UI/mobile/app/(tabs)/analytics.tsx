import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { transactionsService } from "~/services/transactions";
import { useTheme } from "~/theme";
import ThemedView from "~/components/themed/ThemedView";
import ThemedText from "~/components/themed/ThemedText";
import { Analytics } from "~/components/Analytics";

export default function AnalyticsScreen() {
    const { theme } = useTheme();
    const transactionsQuery = useQuery({
        queryKey: ['transactions'],
        queryFn: transactionsService.getTransactions
    })

    if (transactionsQuery.isLoading) {
        return (
            <ThemedView as={SafeAreaView} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
                <ActivityIndicator size="large" color={theme.primary} />
            </ThemedView>
        )
    }

    if (transactionsQuery.isError) {
        return (
            <ThemedView as={SafeAreaView} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
                <ThemedText>Error loading transactions: {transactionsQuery.error.message}</ThemedText>
            </ThemedView>
        )
    }

    if (!transactionsQuery.data) {
        return (
            <ThemedView as={SafeAreaView} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
                <ThemedText>No transactions found</ThemedText>
            </ThemedView>
        )
    }

    return (
        <ThemedView as={SafeAreaView} style={{ flex: 1 }} edges={['top']}>
            <Analytics transactions={transactionsQuery.data} />
        </ThemedView>
    )
}