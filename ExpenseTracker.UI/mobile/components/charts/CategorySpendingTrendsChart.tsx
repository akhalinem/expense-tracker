import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Transaction, Category } from '~/types';
import { useTheme } from '~/theme';
import { formatLargeNumber } from '~/utils/formatNumbers';
import ThemedText from '~/components/themed/ThemedText';
import {
  CHART_CONFIG,
  commonChartStyles,
  getChartColors,
  getChartTextStyle,
} from './chartStyles';

export type CategorySpendingTrendsChartProps = {
  expenses: Transaction[];
  monthsToShow?: number;
  topCategoriesCount?: number;
};

type CategoryTrendData = {
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  monthlyData: { month: string; value: number; label: string }[];
};

export const CategorySpendingTrendsChart: React.FC<
  CategorySpendingTrendsChartProps
> = ({ expenses, monthsToShow = 6, topCategoriesCount = 4 }) => {
  const { theme } = useTheme();
  const chartColors = getChartColors(theme);
  const axisTextStyle = getChartTextStyle(theme, 'axis');

  const chartData = useMemo(
    () => getCategoryTrendsData(expenses, monthsToShow, topCategoriesCount),
    [expenses, monthsToShow, topCategoriesCount]
  );

  if (chartData.length === 0) {
    return (
      <View style={commonChartStyles.emptyContainer}>
        <ThemedText style={commonChartStyles.emptyText}>
          No category spending data available
        </ThemedText>
      </View>
    );
  }

  // Get the primary line data (first category)
  const primaryData = chartData[0]?.monthlyData || [];

  // Get secondary data for additional lines
  const secondaryData = chartData[1]?.monthlyData || [];
  const tertiaryData = chartData[2]?.monthlyData || [];
  const quaternaryData = chartData[3]?.monthlyData || [];
  const quinaryData = chartData[4]?.monthlyData || [];

  // Calculate max value across all data with buffer
  const allValues = useMemo(
    () =>
      chartData.flatMap(({ monthlyData }) => monthlyData.map((d) => d.value)),
    [chartData]
  );
  const maxDataValue = useMemo(() => Math.max(...allValues, 0), [allValues]);
  const maxYValue = maxDataValue * 1.2; // Add 20% buffer

  return (
    <View style={commonChartStyles.container}>
      <View style={commonChartStyles.legendHorizontal}>
        {chartData.slice(0, topCategoriesCount).map((category, index) => (
          <View
            key={category.categoryId}
            style={commonChartStyles.legendItemHorizontal}
          >
            <View
              style={[
                commonChartStyles.legendColorSmall,
                { backgroundColor: category.categoryColor },
              ]}
            />
            <ThemedText style={commonChartStyles.legendText} numberOfLines={1}>
              {category.categoryName}
            </ThemedText>
          </View>
        ))}
      </View>

      <LineChart
        data={primaryData}
        data2={secondaryData.length > 0 ? secondaryData : undefined}
        data3={tertiaryData.length > 0 ? tertiaryData : undefined}
        data4={quaternaryData.length > 0 ? quaternaryData : undefined}
        data5={quinaryData.length > 0 ? quinaryData : undefined}
        height={CHART_CONFIG.HEIGHT}
        width={CHART_CONFIG.WIDTH}
        spacing={50}
        color={chartData[0]?.categoryColor}
        color2={chartData[1]?.categoryColor}
        color3={chartData[2]?.categoryColor}
        color4={chartData[3]?.categoryColor}
        color5={chartData[4]?.categoryColor}
        thickness={CHART_CONFIG.LINE_THICKNESS}
        thickness2={CHART_CONFIG.LINE_THICKNESS}
        thickness3={CHART_CONFIG.LINE_THICKNESS}
        thickness4={CHART_CONFIG.LINE_THICKNESS}
        thickness5={CHART_CONFIG.LINE_THICKNESS}
        dataPointsColor1={chartData[0]?.categoryColor}
        dataPointsColor2={chartData[1]?.categoryColor}
        dataPointsColor3={chartData[2]?.categoryColor}
        dataPointsColor4={chartData[3]?.categoryColor}
        dataPointsColor5={chartData[4]?.categoryColor}
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
        focusEnabled
        focusedDataPointColor={chartColors.focus}
        focusedDataPointRadius={5}
        formatYLabel={formatLargeNumber}
        maxValue={maxYValue}
      />
    </View>
  );
};

const getCategoryTrendsData = (
  expenses: Transaction[],
  monthsToShow: number,
  topCategoriesCount: number
): CategoryTrendData[] => {
  // First, find top categories by total spending
  const categoryTotals = new Map<
    number,
    { category: Category; total: number }
  >();

  expenses.forEach((expense) => {
    expense.categories?.forEach((category) => {
      const current = categoryTotals.get(category.id) || { category, total: 0 };
      current.total += expense.amount;
      categoryTotals.set(category.id, current);
    });
  });

  // Get top categories
  const topCategories = Array.from(categoryTotals.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, topCategoriesCount)
    .map((item) => item.category);

  // Group expenses by category and month
  const categoryMonthlyData = new Map<number, Map<string, number>>();

  expenses.forEach((expense) => {
    const date = new Date(expense.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    expense.categories?.forEach((category) => {
      if (!topCategories.find((tc) => tc.id === category.id)) return;

      if (!categoryMonthlyData.has(category.id)) {
        categoryMonthlyData.set(category.id, new Map());
      }

      const monthlyMap = categoryMonthlyData.get(category.id)!;
      const current = monthlyMap.get(monthKey) || 0;
      monthlyMap.set(monthKey, current + expense.amount);
    });
  });

  // Generate chart data
  const now = new Date();
  const chartData: CategoryTrendData[] = [];

  topCategories.forEach((category) => {
    const monthlySpending = categoryMonthlyData.get(category.id) || new Map();
    const monthlyData: { month: string; value: number; label: string }[] = [];

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const value = monthlySpending.get(monthKey) || 0;

      monthlyData.push({
        month: monthKey,
        value,
        label: monthName,
      });
    }

    chartData.push({
      categoryId: category.id,
      categoryName: category.name,
      categoryColor: category.color,
      monthlyData,
    });
  });

  return chartData;
};

const styles = StyleSheet.create({
  // Custom styles specific to this chart can go here if needed
});
