import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Transaction } from '~/types';
import { useTheme } from '~/theme';
import { formatLargeNumber } from '~/utils/formatNumbers';
import ThemedText from '~/components/themed/ThemedText';

export type MonthOverMonthChartProps = {
  expenses: Transaction[];
  monthsToShow?: number;
};

type MonthOverMonthData = {
  month: string;
  currentAmount: number;
  previousAmount: number;
  changeAmount: number;
  changePercentage: number;
  value: number; // absolute value for chart
  label: string;
  frontColor: string;
  isIncrease: boolean;
};

export const MonthOverMonthChart: React.FC<MonthOverMonthChartProps> = ({
  expenses,
  monthsToShow = 6,
}) => {
  const { theme } = useTheme();
  const chartData = useMemo(
    () => getMonthOverMonthData(expenses, monthsToShow),
    [expenses, monthsToShow]
  );

  if (chartData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText>No month-over-month data available</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#E53E3E' }]} />
          <ThemedText style={styles.legendText}>Increase</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#38A169' }]} />
          <ThemedText style={styles.legendText}>Decrease</ThemedText>
        </View>
      </View>

      <BarChart
        data={chartData}
        height={220}
        width={300}
        barWidth={35}
        barBorderRadius={4}
        hideRules={false}
        rulesColor={theme.textSecondary}
        yAxisTextStyle={{ fontSize: 12, color: theme.textSecondary }}
        xAxisLabelTextStyle={{ fontSize: 12, color: theme.textSecondary }}
        isAnimated
        animationDuration={800}
        yAxisLabelSuffix="%"
        formatYLabel={(value) => {
          const num = parseFloat(value);
          return num.toFixed(0);
        }}
        renderTooltip={(item: any, index: number) => {
          const monthData = chartData[index];
          if (!monthData) return null;

          return (
            <View style={styles.tooltip}>
              <ThemedText style={styles.tooltipText}>
                {monthData.label}
              </ThemedText>
              <ThemedText style={styles.tooltipText}>
                {monthData.changePercentage > 0 ? '+' : ''}
                {monthData.changePercentage.toFixed(1)}%
              </ThemedText>
              <ThemedText style={styles.tooltipAmount}>
                Current: {formatLargeNumber(monthData.currentAmount)}
              </ThemedText>
              <ThemedText style={styles.tooltipAmount}>
                Previous: {formatLargeNumber(monthData.previousAmount)}
              </ThemedText>
              <ThemedText
                style={[
                  styles.tooltipAmount,
                  { color: monthData.isIncrease ? '#E53E3E' : '#38A169' },
                ]}
              >
                {monthData.isIncrease ? '+' : ''}
                {formatLargeNumber(monthData.changeAmount)}
              </ThemedText>
            </View>
          );
        }}
        onPress={(item: any, index: number) => {
          // You can add press handling here if needed
        }}
      />

      <View style={styles.summary}>
        <ThemedText style={styles.summaryTitle}>
          Month-over-Month Changes
        </ThemedText>
        {chartData.slice(-3).map((item, index) => (
          <View key={item.month} style={styles.summaryItem}>
            <ThemedText style={styles.summaryMonth}>{item.label}:</ThemedText>
            <ThemedText
              style={[
                styles.summaryChange,
                { color: item.isIncrease ? '#E53E3E' : '#38A169' },
              ]}
            >
              {item.changePercentage > 0 ? '+' : ''}
              {item.changePercentage.toFixed(1)}%
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
};

const getMonthOverMonthData = (
  expenses: Transaction[],
  monthsToShow: number
): MonthOverMonthData[] => {
  // Group expenses by month
  const monthlyData = new Map<string, number>();

  expenses.forEach((expense) => {
    const date = new Date(expense.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const current = monthlyData.get(monthKey) || 0;
    monthlyData.set(monthKey, current + expense.amount);
  });

  // Get monthly amounts for calculation
  const now = new Date();
  const monthlyAmounts: { month: string; amount: number; label: string }[] = [];

  // Get one extra month for comparison
  for (let i = monthsToShow; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    const amount = monthlyData.get(monthKey) || 0;

    monthlyAmounts.push({
      month: monthKey,
      amount,
      label: monthName,
    });
  }

  // Calculate month-over-month changes (skip the first month as it has no previous)
  const chartData: MonthOverMonthData[] = [];

  for (let i = 1; i < monthlyAmounts.length; i++) {
    const current = monthlyAmounts[i];
    const previous = monthlyAmounts[i - 1];

    const changeAmount = current.amount - previous.amount;
    const changePercentage =
      previous.amount === 0
        ? current.amount > 0
          ? 100
          : 0
        : (changeAmount / previous.amount) * 100;

    const isIncrease = changePercentage > 0;

    chartData.push({
      month: current.month,
      currentAmount: current.amount,
      previousAmount: previous.amount,
      changeAmount,
      changePercentage,
      value: Math.abs(changePercentage),
      label: current.label,
      frontColor: isIncrease ? '#E53E3E' : '#38A169',
      isIncrease,
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
    minWidth: 120,
  },
  tooltipText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  tooltipAmount: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  summary: {
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryMonth: {
    fontSize: 14,
    color: '#666',
  },
  summaryChange: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
