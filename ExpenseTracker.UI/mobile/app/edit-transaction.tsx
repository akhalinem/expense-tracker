import React, { } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { transactionsService } from "~/services/transactions";
import ThemedText from "~/components/themed/ThemedText";
import ThemedView from "~/components/themed/ThemedView";
import { SaveTransaction } from "~/components/SaveTransaction";

export default function EditTransactionScreen() {
    const params = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const transactionQuery = useQuery({
        queryKey: ["transaction", params.id],
        queryFn: () => transactionsService.getTransactionById(Number(params.id))
    })

    if (transactionQuery.isLoading) {
        return (
            <ThemedText>Loading...</ThemedText>
        )
    }

    if (transactionQuery.isError) {
        return (
            <ThemedText>Error: {transactionQuery.error.message}</ThemedText>
        )
    }

    if (!transactionQuery.data) {
        return (
            <ThemedText>Transaction not found</ThemedText>
        )
    }

    const transaction = transactionQuery.data;
    const type = transaction.type;

    return (
        <ThemedView as={SafeAreaView} style={{ flex: 1 }}>
            <SaveTransaction
                type={type}
                transaction={transaction}
                onClose={() => router.back()}
            />
        </ThemedView>
    );
}
