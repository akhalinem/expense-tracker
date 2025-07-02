import React, { useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Transaction } from '~/types';
import { useTheme } from '~/theme';
import { formatLargeNumber } from '~/utils/formatNumbers';
import ThemedText from '~/components/themed/ThemedText';

export type CategoryFrequencyAnalysisChartProps = {
  expenses: Transaction[];
  topCategoriesCount?: number;
};

type CategoryAnalysisData = {
  id: number;
  name: string;
  color: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  percentOfTotal: number;
  efficiencyScore: number; // high frequency + high amount = high score
};

export const CategoryFrequencyAnalysisChart: React.FC<
  CategoryFrequencyAnalysisChartProps
> = ({ expenses, topCategoriesCount = 8 }) => {
  const { theme } = useTheme();
  const categoryData = useMemo(
    () => getCategoryAnalysisData(expenses, topCategoriesCount),
    [expenses, topCategoriesCount]
  );

  if (categoryData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText>No category data available</ThemedText>
      </View>
    );
  }

  // Prepare data for bar chart showing frequency vs amount
  const chartData = categoryData.map((category) => ({
    value: category.transactionCount,
    label:
      category.name.length > 8
        ? category.name.slice(0, 6) + '..'
        : category.name,
    frontColor: category.color,
    spacing: 2,
    labelTextStyle: { fontSize: 10, color: theme.textSecondary },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerText}>
          Category Frequency Analysis
        </ThemedText>
        <ThemedText style={styles.subHeaderText}>
          Transaction count by category (top {topCategoriesCount})
        </ThemedText>
      </View>

      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          height={220}
          width={320}
          barWidth={30}
          spacing={15}
          hideRules={false}
          rulesColor={theme.textSecondary}
          yAxisTextStyle={{ fontSize: 12, color: theme.textSecondary }}
          xAxisLabelTextStyle={{ fontSize: 10, color: theme.textSecondary }}
          isAnimated
          animationDuration={800}
          showFractionalValues={false}
          yAxisLabelSuffix=""
          formatYLabel={(value) => {
            const num = parseFloat(value);
            return num.toFixed(0);
          }}
          renderTooltip={(item: any, index: number) => {
            const category = categoryData[index];
            if (!category) return null;

            return (
              <View style={styles.tooltip}>
                <ThemedText style={styles.tooltipTitle}>
                  {category.name}
                </ThemedText>
                <ThemedText style={styles.tooltipText}>
                  {category.transactionCount} transactions
                </ThemedText>
                <ThemedText style={styles.tooltipText}>
                  {formatLargeNumber(category.totalAmount)} total
                </ThemedText>
                <ThemedText style={styles.tooltipText}>
                  {formatLargeNumber(category.averageAmount)} avg
                </ThemedText>
              </View>
            );
          }}
        />
      </View>

      <ScrollView
        style={styles.legendContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.legendHeader}>
          <ThemedText style={styles.legendHeaderText}>
            Category Details
          </ThemedText>
        </View>

        {categoryData.map((category) => (
          <View key={category.id} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: category.color }]}
            />

            <View style={styles.legendContent}>
              <View style={styles.legendRow}>
                <ThemedText style={styles.categoryName}>
                  {category.name}
                </ThemedText>
                <ThemedText style={styles.percentText}>
                  {category.percentOfTotal.toFixed(1)}% of total
                </ThemedText>
              </View>

              <View style={styles.statsRow}>
                <ThemedText style={styles.statText}>
                  {category.transactionCount} transactions
                </ThemedText>
                <ThemedText style={styles.statText}>
                  {formatLargeNumber(category.totalAmount)} total
                </ThemedText>
                <ThemedText style={styles.statText}>
                  {formatLargeNumber(category.averageAmount)} avg
                </ThemedText>
              </View>

              <View style={styles.insightRow}>
                <ThemedText style={styles.insightText}>
                  {getInsight(category)}
                </ThemedText>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const getCategoryAnalysisData = (
  expenses: Transaction[],
  topCount: number
): CategoryAnalysisData[] => {
  const categoryMap = new Map<
    number,
    {
      category: { id: number; name: string; color: string };
      totalAmount: number;
      transactionCount: number;
    }
  >();

  // Group expenses by category
  expenses.forEach((expense) => {
    expense.categories.forEach((category) => {
      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, {
          category,
          totalAmount: 0,
          transactionCount: 0,
        });
      }

      const data = categoryMap.get(category.id)!;
      data.totalAmount += expense.amount;
      data.transactionCount += 1;
    });
  });

  const totalExpenseAmount = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Convert to analysis data
  const analysisData: CategoryAnalysisData[] = Array.from(categoryMap.values())
    .map(({ category, totalAmount, transactionCount }) => {
      const averageAmount = totalAmount / transactionCount;
      const percentOfTotal = (totalAmount / totalExpenseAmount) * 100;

      // Efficiency score: combines frequency and amount impact
      const normalizedFrequency =
        transactionCount /
        Math.max(
          ...Array.from(categoryMap.values()).map((d) => d.transactionCount)
        );
      const normalizedAmount =
        totalAmount /
        Math.max(...Array.from(categoryMap.values()).map((d) => d.totalAmount));
      const efficiencyScore = (normalizedFrequency + normalizedAmount) / 2;

      return {
        id: category.id,
        name: category.name,
        color: category.color,
        totalAmount,
        transactionCount,
        averageAmount,
        percentOfTotal,
        efficiencyScore,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, topCount);

  return analysisData;
};

const getInsight = (category: CategoryAnalysisData): string => {
  const { transactionCount, averageAmount } = category;

  if (transactionCount > 15 && averageAmount < 50) {
    return 'High frequency, low amount - small recurring expenses';
  } else if (transactionCount < 5 && averageAmount > 200) {
    return 'Low frequency, high amount - major purchases';
  } else if (transactionCount > 10 && averageAmount > 100) {
    return 'High frequency, high amount - significant regular expense';
  } else if (transactionCount < 10 && averageAmount < 100) {
    return 'Moderate usage - occasional smaller purchases';
  } else {
    return 'Balanced spending pattern';
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
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
    minWidth: 140,
  },
  tooltipTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 2,
  },
  legendContainer: {
    maxHeight: 250,
    marginTop: 16,
  },
  legendHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  legendHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  legendItem: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    marginTop: 2,
  },
  legendContent: {
    flex: 1,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  percentText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statText: {
    fontSize: 11,
    opacity: 0.7,
  },
  insightRow: {
    marginTop: 4,
  },
  insightText: {
    fontSize: 11,
    fontStyle: 'italic',
    opacity: 0.8,
  },
});
