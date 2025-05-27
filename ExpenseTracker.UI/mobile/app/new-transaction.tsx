import React, { } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { TransactionTypeEnum } from "~/types";
import ThemedView from "~/components/themed/ThemedView";
import { SaveTransaction } from "~/components/SaveTransaction";

export default function NewTransactionScreen() {
    const router = useRouter();
    const { type = TransactionTypeEnum.EXPENSE } = useLocalSearchParams<{ type?: TransactionTypeEnum }>();

    return (
        <ThemedView as={SafeAreaView} style={{ flex: 1 }}>
            <SaveTransaction
                type={type}
                onClose={() => router.back()}
            />
        </ThemedView>
    );
}
