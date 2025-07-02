import React, { useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Transaction } from '~/types';
import { useTheme } from '~/theme';
import { formatLargeNumber } from '~/utils/formatNumbers';
import ThemedText from '~/components/themed/ThemedText';

export type CategoryGrowthRateChartProps = {
  expenses: Transaction[];
  topCategoriesCount?: number;
};

type CategoryGrowthData = {
  id: number;
  name: string;
  color: string;
  currentMonthAmount: number;
  previousMonthAmount: number;
  growthRate: number; // percentage change
  growthAmount: number; // absolute change
  trend: 'increasing' | 'decreasing' | 'stable' | 'new';
  value: number; // for chart (absolute growth rate)
  label: string; // for chart
  frontColor: string;
};

export const CategoryGrowthRateChart: React.FC<
  CategoryGrowthRateChartProps
> = ({ expenses, topCategoriesCount = 8 }) => {
  const { theme } = useTheme();
  const growthData = useMemo(
    () => getCategoryGrowthData(expenses, topCategoriesCount),
    [expenses, topCategoriesCount]
  );

  if (growthData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText>No growth data available</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerText}>
          Category Growth Rate (Month-over-Month)
        </ThemedText>
        <ThemedText style={styles.subHeaderText}>
          Percentage change from last month
        </ThemedText>
      </View>

      <View style={styles.chartContainer}>
        <BarChart
          data={growthData.map((item) => ({
            value: Math.abs(item.value),
            label: item.label,
            frontColor: item.frontColor,
            labelTextStyle: { fontSize: 10, color: theme.textSecondary },
          }))}
          height={220}
          width={300}
          barWidth={35}
          spacing={20}
          yAxisTextStyle={{ fontSize: 12, color: theme.textSecondary }}
          xAxisLabelTextStyle={{ fontSize: 10, color: theme.textSecondary }}
          hideRules={false}
          rulesColor={theme.textSecondary}
          formatYLabel={(value) => `${value}%`}
          isAnimated
          animationDuration={800}
          showFractionalValues={false}
          maxValue={Math.max(...growthData.map((d) => Math.abs(d.value))) * 1.1}
        />
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendRow}>
          <View style={[styles.legendItem, { backgroundColor: '#e74c3c' }]} />
          <ThemedText style={styles.legendText}>Decreasing</ThemedText>

          <View style={[styles.legendItem, { backgroundColor: '#27ae60' }]} />
          <ThemedText style={styles.legendText}>Increasing</ThemedText>

          <View style={[styles.legendItem, { backgroundColor: '#95a5a6' }]} />
          <ThemedText style={styles.legendText}>Stable/New</ThemedText>
        </View>
      </View>

      <ScrollView
        style={styles.detailsContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.detailsHeader}>Detailed Analysis:</ThemedText>

        {growthData.map((item) => (
          <View key={item.id} style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View
                style={[styles.categoryColor, { backgroundColor: item.color }]}
              />
              <ThemedText style={styles.categoryName}>{item.name}</ThemedText>
              <View style={styles.trendContainer}>
                <ThemedText
                  style={[
                    styles.trendText,
                    { color: getTrendColor(item.trend) },
                  ]}
                >
                  {getTrendIcon(item.trend)} {item.growthRate.toFixed(1)}%
                </ThemedText>
              </View>
            </View>

            <View style={styles.detailBody}>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>
                  Current Month:
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatLargeNumber(item.currentMonthAmount)}
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>
                  Previous Month:
                </ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatLargeNumber(item.previousMonthAmount)}
                </ThemedText>
              </View>

              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Change:</ThemedText>
                <ThemedText
                  style={[
                    styles.detailValue,
                    { color: item.growthAmount >= 0 ? '#e74c3c' : '#27ae60' },
                  ]}
                >
                  {item.growthAmount >= 0 ? '+' : ''}
                  {formatLargeNumber(item.growthAmount)}
                </ThemedText>
              </View>

              <ThemedText style={styles.insightText}>
                {getInsightText(item)}
              </ThemedText>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.summaryContainer}>
        <ThemedText style={styles.summaryText}>
          {getOverallSummary(growthData)}
        </ThemedText>
      </View>
    </View>
  );
};

const getCategoryGrowthData = (
  expenses: Transaction[],
  topCount: number
): CategoryGrowthData[] => {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  // Get current and previous month expenses
  const currentMonthExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= currentMonth;
  });

  const previousMonthExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= previousMonth && expenseDate < currentMonth;
  });

  // Calculate totals by category for both months
  const currentMonthTotals = new Map<
    number,
    { category: any; amount: number }
  >();
  const previousMonthTotals = new Map<
    number,
    { category: any; amount: number }
  >();

  currentMonthExpenses.forEach((expense) => {
    expense.categories.forEach((category) => {
      const current = currentMonthTotals.get(category.id) || {
        category,
        amount: 0,
      };
      currentMonthTotals.set(category.id, {
        category,
        amount: current.amount + expense.amount,
      });
    });
  });

  previousMonthExpenses.forEach((expense) => {
    expense.categories.forEach((category) => {
      const current = previousMonthTotals.get(category.id) || {
        category,
        amount: 0,
      };
      previousMonthTotals.set(category.id, {
        category,
        amount: current.amount + expense.amount,
      });
    });
  });

  // Combine and calculate growth rates
  const allCategoryIds = new Set([
    ...currentMonthTotals.keys(),
    ...previousMonthTotals.keys(),
  ]);

  const growthData: CategoryGrowthData[] = Array.from(allCategoryIds)
    .map((categoryId) => {
      const current = currentMonthTotals.get(categoryId);
      const previous = previousMonthTotals.get(categoryId);

      const currentAmount = current?.amount || 0;
      const previousAmount = previous?.amount || 0;
      const category = current?.category || previous?.category;

      let growthRate = 0;
      let trend: 'increasing' | 'decreasing' | 'stable' | 'new' = 'stable';

      if (previousAmount === 0 && currentAmount > 0) {
        growthRate = 100; // New category
        trend = 'new';
      } else if (previousAmount > 0) {
        growthRate = ((currentAmount - previousAmount) / previousAmount) * 100;
        if (Math.abs(growthRate) < 5) {
          trend = 'stable';
        } else if (growthRate > 0) {
          trend = 'increasing';
        } else {
          trend = 'decreasing';
        }
      }

      const growthAmount = currentAmount - previousAmount;

      return {
        id: categoryId,
        name: category.name,
        color: category.color,
        currentMonthAmount: currentAmount,
        previousMonthAmount: previousAmount,
        growthRate,
        growthAmount,
        trend,
        value: growthRate,
        label:
          category.name.length > 8
            ? category.name.slice(0, 6) + '..'
            : category.name,
        frontColor: getTrendChartColor(trend),
      };
    })
    .filter(
      (item) => item.currentMonthAmount > 0 || item.previousMonthAmount > 0
    )
    .sort((a, b) => Math.abs(b.growthRate) - Math.abs(a.growthRate))
    .slice(0, topCount);

  return growthData;
};

const getTrendColor = (trend: string): string => {
  switch (trend) {
    case 'increasing':
      return '#e74c3c';
    case 'decreasing':
      return '#27ae60';
    case 'new':
      return '#3498db';
    default:
      return '#95a5a6';
  }
};

const getTrendChartColor = (trend: string): string => {
  switch (trend) {
    case 'increasing':
      return '#e74c3c';
    case 'decreasing':
      return '#27ae60';
    case 'new':
      return '#95a5a6';
    default:
      return '#95a5a6';
  }
};

const getTrendIcon = (trend: string): string => {
  switch (trend) {
    case 'increasing':
      return '📈';
    case 'decreasing':
      return '📉';
    case 'new':
      return '🆕';
    default:
      return '➡️';
  }
};

const getInsightText = (item: CategoryGrowthData): string => {
  if (item.trend === 'new') {
    return 'New spending category this month';
  } else if (item.trend === 'increasing' && Math.abs(item.growthRate) > 50) {
    return 'Significant increase - review recent purchases';
  } else if (item.trend === 'decreasing' && Math.abs(item.growthRate) > 30) {
    return 'Good reduction in spending!';
  } else if (item.trend === 'stable') {
    return 'Consistent spending pattern';
  } else {
    return `${item.growthRate > 0 ? 'Increased' : 'Decreased'} spending`;
  }
};

const getOverallSummary = (data: CategoryGrowthData[]): string => {
  const increasing = data.filter((d) => d.trend === 'increasing').length;
  const decreasing = data.filter((d) => d.trend === 'decreasing').length;

  if (increasing > decreasing) {
    return `📊 ${increasing} categories increased, ${decreasing} decreased. Monitor growing expenses.`;
  } else if (decreasing > increasing) {
    return `🎯 ${decreasing} categories decreased, ${increasing} increased. Good spending control!`;
  } else {
    return `⚖️ Balanced month: ${increasing} categories up, ${decreasing} down.`;
  }
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
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  subHeaderText: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  legendContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legendItem: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    marginRight: 8,
  },
  detailsContainer: {
    maxHeight: 400,
    marginHorizontal: 16,
  },
  detailsHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  trendContainer: {
    alignItems: 'flex-end',
  },
  trendText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailBody: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  insightText: {
    fontSize: 11,
    fontStyle: 'italic',
    opacity: 0.8,
    marginTop: 4,
  },
  summaryContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});
