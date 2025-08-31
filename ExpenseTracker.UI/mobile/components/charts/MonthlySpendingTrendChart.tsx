import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Transaction } from '~/types';
import { useTheme } from '~/theme';
import { formatLargeNumber } from '~/utils/formatNumbers';
import ThemedText from '~/components/themed/ThemedText';
import {
  CHART_CONFIG,
  CHART_TYPOGRAPHY,
  commonChartStyles,
  getChartColors,
  getChartTextStyle,
} from './chartStyles';

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
  const chartColors = getChartColors(theme);
  const axisTextStyle = getChartTextStyle(theme, 'axis');
  const focusTextStyle = getChartTextStyle(theme, 'focus');

  const chartData = useMemo(
    () => getMonthlySpendingData(expenses, monthsToShow),
    [expenses, monthsToShow]
  );

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
      <LineChart
        data={chartData}
        height={CHART_CONFIG.HEIGHT}
        width={CHART_CONFIG.WIDTH}
        spacing={50}
        color={chartColors.primary}
        thickness={CHART_CONFIG.LINE_THICKNESS}
        dataPointsColor={chartColors.primary}
        dataPointsHeight={CHART_CONFIG.DATA_POINT_SIZE}
        dataPointsWidth={CHART_CONFIG.DATA_POINT_SIZE}
        dataPointsRadius={CHART_CONFIG.DATA_POINT_RADIUS}
        hideRules={false}
        rulesColor={chartColors.grid}
        yAxisTextStyle={axisTextStyle}
        xAxisLabelTextStyle={axisTextStyle}
        curved
        animationDuration={CHART_CONFIG.ANIMATION_DURATION}
        isAnimated
        showDataPointOnFocus
        showStripOnFocus
        showTextOnFocus
        textShiftY={-8}
        textShiftX={-5}
        textColor={chartColors.primary}
        textFontSize={CHART_TYPOGRAPHY.LABEL}
        focusEnabled
        focusedDataPointColor={chartColors.focus}
        focusedDataPointRadius={5}
        formatYLabel={formatLargeNumber}
      />

      <View style={commonChartStyles.insightsContainer}>
        <ThemedText style={commonChartStyles.insightsTitle}>
          Trend Insights
        </ThemedText>
        {getSpendingInsights(chartData).map((insight, index) => (
          <ThemedText key={index} style={commonChartStyles.insightText}>
            • {insight}
          </ThemedText>
        ))}
      </View>
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

const getSpendingInsights = (data: MonthlySpendingData[]): string[] => {
  if (data.length === 0) return ['No data available for analysis'];

  const insights: string[] = [];

  // Find highest and lowest spending months
  const highestMonth = data.reduce((max, current) =>
    current.total > max.total ? current : max
  );
  const lowestMonth = data.reduce((min, current) =>
    current.total < min.total ? current : min
  );

  if (highestMonth.total > 0) {
    insights.push(
      `Highest spending: ${highestMonth.label} (${formatLargeNumber(highestMonth.total)})`
    );
  }

  if (lowestMonth.total > 0) {
    insights.push(
      `Lowest spending: ${lowestMonth.label} (${formatLargeNumber(lowestMonth.total)})`
    );
  }

  // Calculate average
  const average = data.reduce((sum, d) => sum + d.total, 0) / data.length;
  insights.push(`Average monthly spending: ${formatLargeNumber(average)}`);

  // Trend analysis
  if (data.length >= 3) {
    const recentAvg = data.slice(-2).reduce((sum, d) => sum + d.total, 0) / 2;
    const olderAvg = data.slice(0, 2).reduce((sum, d) => sum + d.total, 0) / 2;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (Math.abs(change) > 10) {
      if (change > 0) {
        insights.push(
          `Recent months show ${change.toFixed(1)}% increase in spending 📈`
        );
      } else {
        insights.push(
          `Recent months show ${Math.abs(change).toFixed(1)}% decrease in spending 📉`
        );
      }
    } else {
      insights.push('Spending remains relatively stable');
    }
  }

  // Consistency analysis
  const variance =
    data.reduce((sum, d) => sum + Math.pow(d.total - average, 2), 0) /
    data.length;
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = (standardDeviation / average) * 100;

  if (coefficientOfVariation < 20) {
    insights.push('Spending pattern is very consistent');
  } else if (coefficientOfVariation < 40) {
    insights.push('Spending pattern is moderately consistent');
  } else {
    insights.push('Spending pattern is highly variable');
  }

  return insights;
};

const styles = StyleSheet.create({
  // Custom styles specific to this chart can go here if needed
});
