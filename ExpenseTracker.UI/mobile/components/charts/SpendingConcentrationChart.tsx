import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Transaction } from '~/types';
import { useTheme } from '~/theme';
import ThemedText from '~/components/themed/ThemedText';

export type SpendingConcentrationChartProps = {
  expenses: Transaction[];
};

type ParetoData = {
  category: string;
  amount: number;
  percentOfTotal: number;
  cumulativePercent: number;
  value: number; // for bar chart
  label: string; // for chart
  labelTextStyle?: any;
};

export const SpendingConcentrationChart: React.FC<
  SpendingConcentrationChartProps
> = ({ expenses }) => {
  const { theme } = useTheme();
  const paretoData = useMemo(() => getParetoData(expenses), [expenses]);

  if (paretoData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText>No spending data available</ThemedText>
      </View>
    );
  }

  // Find the 80% mark
  const eightyPercentMark = useMemo(
    () => paretoData.findIndex((item) => item.cumulativePercent >= 80),
    [paretoData]
  );
  const categoriesFor80Percent =
    eightyPercentMark !== -1 ? eightyPercentMark + 1 : paretoData.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerText}>
          Spending Concentration (Pareto Analysis)
        </ThemedText>
        <ThemedText style={styles.subHeaderText}>
          {categoriesFor80Percent} categories account for 80% of spending
        </ThemedText>
      </View>

      <View style={styles.chartContainer}>
        <BarChart
          data={paretoData.map((item, index) => ({
            ...item,
            frontColor:
              index < categoriesFor80Percent
                ? theme.primary
                : theme.textSecondary,
          }))}
          height={200}
          width={300}
          barWidth={30}
          spacing={10}
          yAxisTextStyle={{ fontSize: 10, color: theme.textSecondary }}
          xAxisLabelTextStyle={{ fontSize: 9, color: theme.textSecondary }}
          hideRules={false}
          rulesColor={theme.textSecondary}
          formatYLabel={(value) => `${value}%`}
          isAnimated
          animationDuration={800}
          showFractionalValues={false}
          maxValue={100}
        />
      </View>

      <View style={styles.insightsContainer}>
        <View style={styles.insightRow}>
          <View style={[styles.colorBox, { backgroundColor: theme.primary }]} />
          <ThemedText style={styles.insightText}>
            Top {categoriesFor80Percent} categories (80% of spending)
          </ThemedText>
        </View>

        <View style={styles.insightRow}>
          <View
            style={[styles.colorBox, { backgroundColor: theme.textSecondary }]}
          />
          <ThemedText style={styles.insightText}>
            Remaining {paretoData.length - categoriesFor80Percent} categories
            (20% of spending)
          </ThemedText>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <ThemedText style={styles.detailsHeader}>
          Category Breakdown:
        </ThemedText>
        {paretoData.slice(0, 6).map((item, index) => (
          <View key={index} style={styles.detailRow}>
            <ThemedText style={styles.rankText}>#{index + 1}</ThemedText>
            <ThemedText style={styles.categoryText}>{item.category}</ThemedText>
            <ThemedText style={styles.percentText}>
              {item.percentOfTotal.toFixed(1)}%
            </ThemedText>
            <ThemedText style={styles.cumulativeText}>
              ({item.cumulativePercent.toFixed(1)}% total)
            </ThemedText>
          </View>
        ))}

        {paretoData.length > 6 && (
          <ThemedText style={styles.moreText}>
            ... and {paretoData.length - 6} more categories
          </ThemedText>
        )}
      </View>

      <View style={styles.summaryContainer}>
        <ThemedText style={styles.summaryText}>
          💡 Focus on the top {categoriesFor80Percent} categories to impact 80%
          of your spending
        </ThemedText>
      </View>
    </View>
  );
};

const getParetoData = (expenses: Transaction[]): ParetoData[] => {
  const categoryMap = new Map<string, number>();

  // Group expenses by category
  expenses.forEach((expense) => {
    expense.categories.forEach((category) => {
      const current = categoryMap.get(category.name) || 0;
      categoryMap.set(category.name, current + expense.amount);
    });
  });

  const totalAmount = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Convert to array and sort by amount
  const categoryData = Array.from(categoryMap.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentOfTotal: (amount / totalAmount) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Calculate cumulative percentages
  let cumulativePercent = 0;
  const paretoData: ParetoData[] = categoryData.map((item) => {
    cumulativePercent += item.percentOfTotal;

    return {
      category: item.category,
      amount: item.amount,
      percentOfTotal: item.percentOfTotal,
      cumulativePercent,
      value: item.percentOfTotal,
      label:
        item.category.length > 8
          ? item.category.slice(0, 6) + '..'
          : item.category,
      labelTextStyle: {
        fontSize: 9,
        color: '#666',
      },
    };
  });

  return paretoData;
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
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  insightsContainer: {
    marginVertical: 16,
    gap: 8,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  colorBox: {
    width: 12,
    height: 12,
    marginRight: 8,
    borderRadius: 2,
  },
  insightText: {
    fontSize: 12,
    flex: 1,
  },
  detailsContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  detailsHeader: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 30,
    opacity: 0.6,
  },
  categoryText: {
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  percentText: {
    fontSize: 12,
    fontWeight: '500',
    width: 50,
    textAlign: 'right',
  },
  cumulativeText: {
    fontSize: 10,
    opacity: 0.6,
    width: 70,
    textAlign: 'right',
  },
  moreText: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
    textAlign: 'center',
    marginTop: 8,
  },
  summaryContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  summaryText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
