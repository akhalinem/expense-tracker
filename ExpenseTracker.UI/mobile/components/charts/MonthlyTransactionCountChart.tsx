import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Transaction } from '~/types';
import { useTheme } from '~/theme';
import ThemedText from '~/components/themed/ThemedText';

export type MonthlyTransactionCountChartProps = {
  transactions: Transaction[];
  monthsToShow?: number;
};

type MonthlyTransactionData = {
  month: string;
  count: number;
  value: number; // for chart
  label: string; // for chart
};

export const MonthlyTransactionCountChart: React.FC<
  MonthlyTransactionCountChartProps
> = ({ transactions, monthsToShow = 6 }) => {
  const { theme } = useTheme();
  const chartData = useMemo(
    () => getMonthlyTransactionData(transactions, monthsToShow),
    [transactions, monthsToShow]
  );

  if (chartData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText>No transaction data available</ThemedText>
      </View>
    );
  }

  const maxValue = Math.max(...chartData.map((item) => item.count));
  const yAxisLabelInterval = Math.ceil(maxValue / 5);

  return (
    <View style={styles.container}>
      <BarChart
        data={chartData}
        height={220}
        width={320}
        frontColor={theme.primary}
        rulesColor={theme.textSecondary}
        yAxisTextStyle={{ fontSize: 12, color: theme.textSecondary }}
        xAxisLabelTextStyle={{ fontSize: 12, color: theme.textSecondary }}
        animationDuration={800}
        isAnimated
        maxValue={maxValue}
        stepValue={yAxisLabelInterval}
        disableScroll
      />
    </View>
  );
};

const getMonthlyTransactionData = (
  transactions: Transaction[],
  monthsToShow: number
): MonthlyTransactionData[] => {
  // Group transactions by month
  const monthlyData = new Map<string, number>();

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const current = monthlyData.get(monthKey) || 0;
    monthlyData.set(monthKey, current + 1);
  });

  // Get last N months
  const now = new Date();
  const chartData: MonthlyTransactionData[] = [];

  for (let i = monthsToShow - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const count = monthlyData.get(monthKey) || 0;

    chartData.push({
      month: monthKey,
      count,
      value: count,
      label: monthName,
    });
  }

  return chartData;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});
