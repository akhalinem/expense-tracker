import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Transaction } from '~/types';
import { useTheme } from '~/theme';
import { formatLargeNumber } from '~/utils/formatNumbers';
import ThemedText from '~/components/themed/ThemedText';

export type WeeklySpendingVelocityChartProps = {
  expenses: Transaction[];
  monthsToShow?: number;
};

type WeeklySpendingData = {
  weekNumber: number;
  weekLabel: string;
  totalAmount: number;
  value: number; // for chart
  label: string; // for chart
};

export const WeeklySpendingVelocityChart: React.FC<
  WeeklySpendingVelocityChartProps
> = ({ expenses, monthsToShow = 3 }) => {
  const { theme } = useTheme();
  const chartData = useMemo(
    () => getWeeklySpendingData(expenses, monthsToShow),
    [expenses, monthsToShow]
  );

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
        width={300}
        spacing={60}
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
      <View style={styles.insightsContainer}>
        <ThemedText style={styles.insightText}>
          Shows spending velocity throughout each month
        </ThemedText>
        <ThemedText style={styles.insightText}>
          Peak week: {getPeakWeek(chartData)}
        </ThemedText>
      </View>
    </View>
  );
};

const getWeeklySpendingData = (
  expenses: Transaction[],
  monthsToShow: number
): WeeklySpendingData[] => {
  const now = new Date();
  const chartData: WeeklySpendingData[] = [];

  // Get data for each of the last N months
  for (let monthOffset = monthsToShow - 1; monthOffset >= 0; monthOffset--) {
    const targetMonth = new Date(
      now.getFullYear(),
      now.getMonth() - monthOffset,
      1
    );
    const monthKey = `${targetMonth.getFullYear()}-${String(targetMonth.getMonth() + 1).padStart(2, '0')}`;

    // Get expenses for this month
    const monthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getFullYear() === targetMonth.getFullYear() &&
        expenseDate.getMonth() === targetMonth.getMonth()
      );
    });

    // Group by week within the month
    const weeklyData = new Map<number, number>();

    monthExpenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      const weekOfMonth = Math.ceil(expenseDate.getDate() / 7);
      const current = weeklyData.get(weekOfMonth) || 0;
      weeklyData.set(weekOfMonth, current + expense.amount);
    });

    // Add data for each week of this month
    for (let week = 1; week <= 4; week++) {
      const totalAmount = weeklyData.get(week) || 0;
      const monthName = targetMonth.toLocaleDateString('en-US', {
        month: 'short',
      });

      chartData.push({
        weekNumber: week,
        weekLabel: `${monthName} W${week}`,
        totalAmount,
        value: totalAmount,
        label: `W${week}`,
      });
    }
  }

  return chartData;
};

const getPeakWeek = (data: WeeklySpendingData[]): string => {
  if (data.length === 0) return 'N/A';

  const maxWeek = data.reduce((max, current) =>
    current.totalAmount > max.totalAmount ? current : max
  );
  return `${maxWeek.weekLabel} (${formatLargeNumber(maxWeek.totalAmount)})`;
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
  insightsContainer: {
    marginTop: 16,
    gap: 4,
  },
  insightText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
});
