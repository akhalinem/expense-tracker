import { FC } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { transactionsService } from '~/services/transactions';
import { useTheme } from '~/theme';
import { displayCurrency } from '~/utils';
import ThemedView from '~/components/themed/ThemedView';
import ThemedText from '~/components/themed/ThemedText';
import { Transactions } from '~/components/Transactions';

export default function TransactionsScreen() {
  const transactionsQuery = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsService.getTransactions,
  });

  const transactions = transactionsQuery.data ?? [];

  // Calculate total balance across all transactions
  const totalBalance = transactions.reduce((sum, t) => {
    return sum + (t.type === 'income' ? t.amount : -t.amount);
  }, 0);

  return (
    <>
      <Header totalBalance={totalBalance} />

      <ThemedView style={{ flex: 1 }}>
        <Transactions transactions={transactions} />
      </ThemedView>
    </>
  );
}

const Header: FC<{ totalBalance: number }> = ({ totalBalance }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedView>
        <ThemedText style={[styles.balanceLabel, { color: theme.secondary }]}>
          Balance
        </ThemedText>
        <ThemedText
          style={[
            styles.balanceAmount,
            { color: totalBalance >= 0 ? theme.success : theme.error },
          ]}
        >
          {displayCurrency(totalBalance)}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
