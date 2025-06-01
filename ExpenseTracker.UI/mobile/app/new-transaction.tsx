import React from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { TransactionTypeEnum } from "~/types";
import { SaveTransaction } from "~/components/SaveTransaction";

export default function NewTransactionScreen() {
    const router = useRouter();
    const { type = TransactionTypeEnum.EXPENSE } = useLocalSearchParams<{ type?: TransactionTypeEnum }>();

    return (
        <SaveTransaction
            type={type}
            onClose={() => router.back()}
        />
    );
}
