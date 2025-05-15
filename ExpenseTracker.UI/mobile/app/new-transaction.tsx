import React, { } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { TransactionTypeEnum } from "~/types";
import { SaveTransaction } from "~/components/SaveTransaction";

export default function NewTransactionScreen() {
    const params = useLocalSearchParams<{ type: TransactionTypeEnum }>();
    const router = useRouter();

    return (
        <SaveTransaction
            type={params.type}
            onClose={() => router.back()}
        />
    );
}
