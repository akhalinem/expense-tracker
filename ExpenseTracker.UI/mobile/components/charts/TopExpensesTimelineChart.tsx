import React, { useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Transaction } from '~/types';
import { useTheme } from '~/theme';
import { formatLargeNumber } from '~/utils/formatNumbers';
import ThemedText from '~/components/themed/ThemedText';

export type TopExpensesTimelineChartProps = {
  expenses: Transaction[];
  topCount?: number;
  periodInDays?: number;
};

type TopExpenseData = {
  id: number;
  amount: number;
  description: string;
  date: string;
  categories: string[];
  daysSinceExpense: number;
};

export const TopExpensesTimelineChart: React.FC<
  TopExpensesTimelineChartProps
> = ({ expenses, topCount = 10, periodInDays = 90 }) => {
  const { theme } = useTheme();
  const topExpenses = useMemo(
    () => getTopExpensesData(expenses, topCount, periodInDays),
    [expenses, topCount, periodInDays]
  );

  if (topExpenses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText>No large expenses in the selected period</ThemedText>
      </View>
    );
  }

  const maxAmount = useMemo(
    () => Math.max(...topExpenses.map((e) => e.amount)),
    [topExpenses]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerText}>
          Top {topCount} Expenses (Last {periodInDays} days)
        </ThemedText>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {topExpenses.map((expense, index) => {
          const barWidth = (expense.amount / maxAmount) * 100;

          return (
            <View key={expense.id} style={styles.expenseItem}>
              <View style={styles.rankContainer}>
                <ThemedText style={styles.rankText}>#{index + 1}</ThemedText>
              </View>

              <View style={styles.expenseContent}>
                <View style={styles.expenseHeader}>
                  <ThemedText style={styles.descriptionText} numberOfLines={1}>
                    {expense.description}
                  </ThemedText>
                  <ThemedText style={styles.amountText}>
                    {formatLargeNumber(expense.amount)}
                  </ThemedText>
                </View>

                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${barWidth}%`,
                        backgroundColor: theme.primary,
                      },
                    ]}
                  />
                </View>

                <View style={styles.expenseFooter}>
                  <ThemedText style={styles.categoriesText}>
                    {expense.categories.join(', ')}
                  </ThemedText>
                  <ThemedText style={styles.dateText}>
                    {expense.daysSinceExpense === 0
                      ? 'Today'
                      : expense.daysSinceExpense === 1
                        ? 'Yesterday'
                        : `${expense.daysSinceExpense} days ago`}
                  </ThemedText>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.summaryContainer}>
        <ThemedText style={styles.summaryText}>
          Total:{' '}
          {formatLargeNumber(topExpenses.reduce((sum, e) => sum + e.amount, 0))}
        </ThemedText>
        <ThemedText style={styles.summaryText}>
          Average:{' '}
          {formatLargeNumber(
            topExpenses.reduce((sum, e) => sum + e.amount, 0) /
              topExpenses.length
          )}
        </ThemedText>
      </View>
    </View>
  );
};

const getTopExpensesData = (
  expenses: Transaction[],
  topCount: number,
  periodInDays: number
): TopExpenseData[] => {
  const now = new Date();
  const cutoffDate = new Date(
    now.getTime() - periodInDays * 24 * 60 * 60 * 1000
  );

  // Filter expenses within the period
  const recentExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= cutoffDate;
  });

  // Sort by amount and take top N
  const topExpenses = recentExpenses
    .sort((a, b) => b.amount - a.amount)
    .slice(0, topCount)
    .map((expense) => {
      const expenseDate = new Date(expense.date);
      const daysSinceExpense = Math.floor(
        (now.getTime() - expenseDate.getTime()) / (24 * 60 * 60 * 1000)
      );

      return {
        id: expense.id,
        amount: expense.amount,
        description: expense.description,
        date: expense.date,
        categories: expense.categories.map((cat) => cat.name),
        daysSinceExpense,
      };
    });

  return topExpenses;
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    maxHeight: 300,
  },
  expenseItem: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  rankContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    opacity: 0.6,
  },
  expenseContent: {
    flex: 1,
    marginLeft: 8,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  amountText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  barContainer: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginVertical: 4,
  },
  bar: {
    height: '100%',
    borderRadius: 2,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoriesText: {
    fontSize: 12,
    opacity: 0.7,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    opacity: 0.7,
  },
  summaryContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
