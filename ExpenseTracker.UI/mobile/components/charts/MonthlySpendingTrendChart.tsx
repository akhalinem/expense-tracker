import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Transaction } from '~/types';
import ThemedText from '../themed/ThemedText';
import { formatLargeNumber } from '~/utils/formatNumbers';
import { useTheme } from '~/theme';

export type MonthlySpendingTrendChartProps = {
  expenses: Transaction[];
  monthsToShow?: number;
};

type MonthlySpendingData = {
  month: string;
  total: number;
  value: number; // for chart
  label: string; // for chart
};

export const MonthlySpendingTrendChart: React.FC<
  MonthlySpendingTrendChartProps
> = ({ expenses, monthsToShow = 6 }) => {
  const { theme } = useTheme();
  const chartData = getMonthlySpendingData(expenses, monthsToShow);

  if (chartData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText>No spending data available</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        height={220}
        spacing={50}
        color={theme.primary}
        thickness={3}
        dataPointsColor={theme.primary}
        dataPointsHeight={6}
        dataPointsWidth={6}
        dataPointsRadius={3}
        hideRules={false}
        rulesColor={theme.textSecondary}
        yAxisTextStyle={{ fontSize: 12, color: theme.textSecondary }}
        xAxisLabelTextStyle={{ fontSize: 12, color: theme.textSecondary }}
        curved
        animationDuration={800}
        isAnimated
        showDataPointOnFocus
        showStripOnFocus
        showTextOnFocus
        textShiftY={-8}
        textShiftX={-5}
        textColor={theme.primary}
        textFontSize={12}
        focusEnabled
        focusedDataPointColor={theme.primary}
        focusedDataPointRadius={5}
        formatYLabel={formatLargeNumber}
      />
    </View>
  );
};

const getMonthlySpendingData = (
  expenses: Transaction[],
  monthsToShow: number
): MonthlySpendingData[] => {
  // Group expenses by month
  const monthlyData = new Map<string, number>();

  expenses.forEach((expense) => {
    const date = new Date(expense.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const current = monthlyData.get(monthKey) || 0;
    monthlyData.set(monthKey, current + expense.amount);
  });

  // Get last N months
  const now = new Date();
  const chartData: MonthlySpendingData[] = [];

  for (let i = monthsToShow - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const total = monthlyData.get(monthKey) || 0;

    chartData.push({
      month: monthKey,
      total,
      value: total,
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
  yAxisText: {
    fontSize: 12,
    color: '#666',
  },
  xAxisText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
