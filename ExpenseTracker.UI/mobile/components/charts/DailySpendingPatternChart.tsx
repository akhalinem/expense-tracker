import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Transaction } from '~/types';
import { useTheme } from '~/theme';
import { formatLargeNumber } from '~/utils/formatNumbers';
import ThemedText from '~/components/themed/ThemedText';
import {
  CHART_CONFIG,
  commonChartStyles,
  getChartColors,
  getChartTextStyle,
} from './chartStyles';

export type DailySpendingPatternChartProps = {
  expenses: Transaction[];
};

type DaySpendingData = {
  day: string;
  dayIndex: number;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  value: number; // for chart
  label: string; // for chart
};

export const DailySpendingPatternChart: React.FC<
  DailySpendingPatternChartProps
> = ({ expenses }) => {
  const { theme } = useTheme();
  const chartColors = getChartColors(theme);
  const axisTextStyle = getChartTextStyle(theme, 'axis');

  const chartData = useMemo(() => getDailySpendingData(expenses), [expenses]);

  if (chartData.length === 0) {
    return (
      <View style={commonChartStyles.emptyContainer}>
        <ThemedText style={commonChartStyles.emptyText}>
          No spending data available
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={commonChartStyles.container}>
      <BarChart
        data={chartData}
        height={CHART_CONFIG.HEIGHT}
        width={CHART_CONFIG.WIDTH}
        barWidth={CHART_CONFIG.BAR_WIDTH}
        spacing={CHART_CONFIG.BAR_SPACING}
        frontColor={chartColors.primary}
        yAxisTextStyle={axisTextStyle}
        xAxisLabelTextStyle={axisTextStyle}
        hideRules={false}
        rulesColor={chartColors.grid}
        formatYLabel={formatLargeNumber}
        isAnimated
        animationDuration={CHART_CONFIG.ANIMATION_DURATION}
        showFractionalValues={false}
        maxValue={Math.max(...chartData.map((d) => d.value)) * 1.1}
      />

      <View style={commonChartStyles.insightsContainer}>
        <ThemedText style={commonChartStyles.insightsTitle}>
          Weekly Patterns
        </ThemedText>
        <ThemedText style={commonChartStyles.insightText}>
          Most expensive day: {getMostExpensiveDay(chartData)}
        </ThemedText>
        <ThemedText style={commonChartStyles.insightText}>
          Least expensive day: {getLeastExpensiveDay(chartData)}
        </ThemedText>
        <ThemedText style={commonChartStyles.insightText}>
          Average per day: {getAverageSpending(chartData)}
        </ThemedText>
      </View>
    </View>
  );
};

const getDailySpendingData = (expenses: Transaction[]): DaySpendingData[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyData = new Map<number, { total: number; count: number }>();

  // Initialize all days
  for (let i = 0; i < 7; i++) {
    dailyData.set(i, { total: 0, count: 0 });
  }

  // Group expenses by day of week
  expenses.forEach((expense) => {
    const date = new Date(expense.date);
    const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const current = dailyData.get(dayIndex)!;
    dailyData.set(dayIndex, {
      total: current.total + expense.amount,
      count: current.count + 1,
    });
  });

  // Convert to chart data
  const chartData: DaySpendingData[] = [];

  for (let i = 0; i < 7; i++) {
    const data = dailyData.get(i)!;
    const averageAmount = data.count > 0 ? data.total / data.count : 0;

    chartData.push({
      day: days[i],
      dayIndex: i,
      totalAmount: data.total,
      transactionCount: data.count,
      averageAmount,
      value: data.total,
      label: days[i],
    });
  }

  return chartData;
};

const getMostExpensiveDay = (data: DaySpendingData[]): string => {
  const maxDay = data.reduce((max, current) =>
    current.totalAmount > max.totalAmount ? current : max
  );
  return `${maxDay.day} (${formatLargeNumber(maxDay.totalAmount)})`;
};

const getLeastExpensiveDay = (data: DaySpendingData[]): string => {
  const minDay = data.reduce((min, current) =>
    current.totalAmount < min.totalAmount ? current : min
  );
  return `${minDay.day} (${formatLargeNumber(minDay.totalAmount)})`;
};

const getAverageSpending = (data: DaySpendingData[]): string => {
  const total = data.reduce((sum, day) => sum + day.totalAmount, 0);
  const average = data.length > 0 ? total / data.length : 0;
  return formatLargeNumber(average);
};

const styles = StyleSheet.create({
  // Custom styles specific to this chart can go here if needed
});
