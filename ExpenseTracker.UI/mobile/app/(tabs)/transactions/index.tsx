import { useQuery } from '@tanstack/react-query';
import { transactionsService } from '~/services/transactions';
import ThemedView from '~/components/themed/ThemedView';
import { Transactions } from '~/components/Transactions';

export default function TransactionsScreen() {
    const transactionsQuery = useQuery({
        queryKey: ['transactions'],
        queryFn: transactionsService.getTransactions
    });

    const transactions = transactionsQuery.data ?? [];

    return (
        <ThemedView style={{ flex: 1 }}>
            <Transactions transactions={transactions} />
        </ThemedView>
    );
}
