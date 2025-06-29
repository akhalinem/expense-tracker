import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Transaction, Category } from '~/types';
import { formatLargeNumber } from '~/utils/formatNumbers';
import { useTheme } from '~/theme';
import ThemedText from '~/components/themed/ThemedText';

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
  const chartData = getCategoryTrendsData(
    expenses,
    monthsToShow,
    topCategoriesCount
  );

  if (chartData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText>No category spending data available</ThemedText>
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
  const allValues = chartData.flatMap(({ monthlyData }) =>
    monthlyData.map((d) => d.value)
  );
  const maxDataValue = Math.max(...allValues, 0);
  const maxYValue = maxDataValue * 1.2; // Add 20% buffer

  return (
    <View style={styles.container}>
      <View style={styles.legend}>
        {chartData.slice(0, topCategoriesCount).map((category, index) => (
          <View key={category.categoryId} style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                { backgroundColor: category.categoryColor },
              ]}
            />
            <ThemedText style={styles.legendText} numberOfLines={1}>
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
        height={220}
        spacing={50}
        color={chartData[0]?.categoryColor}
        color2={chartData[1]?.categoryColor}
        color3={chartData[2]?.categoryColor}
        color4={chartData[3]?.categoryColor}
        color5={chartData[4]?.categoryColor}
        thickness={3}
        thickness2={3}
        thickness3={3}
        thickness4={3}
        thickness5={3}
        dataPointsColor1={chartData[0]?.categoryColor}
        dataPointsColor2={chartData[1]?.categoryColor}
        dataPointsColor3={chartData[2]?.categoryColor}
        dataPointsColor4={chartData[3]?.categoryColor}
        dataPointsColor5={chartData[4]?.categoryColor}
        dataPointsHeight={6}
        dataPointsWidth={6}
        dataPointsRadius={3}
        hideRules={false}
        rulesColor={theme.secondary}
        yAxisTextStyle={{ fontSize: 12, color: theme.textSecondary }}
        xAxisLabelTextStyle={{ fontSize: 12, color: theme.textSecondary }}
        curved
        animationDuration={800}
        isAnimated
        focusEnabled
        focusedDataPointColor={theme.primary}
        focusedDataPointRadius={5}
        formatYLabel={formatLargeNumber}
        maxValue={maxYValue}
        onFocus={(item: any, index: number) => {
          // You can add custom focus handling here if needed
        }}
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
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 120,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
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
