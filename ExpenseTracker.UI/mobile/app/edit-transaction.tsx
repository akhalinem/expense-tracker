import React, { } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { transactionsService } from "~/services/transactions";
import ThemedText from "~/components/themed/ThemedText";
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
        <SaveTransaction
            type={type}
            transaction={transaction}
            onClose={() => router.back()}
        />
    );
}
