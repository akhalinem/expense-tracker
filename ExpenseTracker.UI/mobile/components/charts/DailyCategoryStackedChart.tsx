import React, { useMemo, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
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

export type DailyCategoryStackedChartProps = {
  transactions: Transaction[];
  selectedMonth?: Date;
};

type DailyData = {
  date: string;
  day: number;
  stacks: Array<{
    value: number;
    color: string;
    categoryId: number;
    categoryName: string;
  }>;
  balance: number;
  totalSpent: number;
  label: string;
};

export const DailyCategoryStackedChart: React.FC<
  DailyCategoryStackedChartProps
> = ({ transactions, selectedMonth = new Date() }) => {
  const { theme } = useTheme();
  const chartColors = getChartColors(theme);
  const axisTextStyle = getChartTextStyle(theme, 'axis');

  // State for month/year selection
  const [currentMonth, setCurrentMonth] = useState(selectedMonth);

  const { chartData, lineData, monthlyBalance, categories } = useMemo(
    () => getDailyCategoryStackedData(transactions, currentMonth),
    [transactions, currentMonth]
  );

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  if (chartData.length === 0) {
    return (
      <View style={commonChartStyles.emptyContainer}>
        <ThemedText style={commonChartStyles.emptyText}>
          No spending data for{' '}
          {currentMonth.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </ThemedText>
        <MonthNavigation
          currentMonth={currentMonth}
          onNavigate={navigateMonth}
        />
      </View>
    );
  }

  return (
    <View style={commonChartStyles.container}>
      <MonthNavigation currentMonth={currentMonth} onNavigate={navigateMonth} />

      <View style={styles.chartContainer}>
        <View style={styles.scrollHint}>
          <ThemedText style={styles.scrollHintText}>
            ← Scroll horizontally to view all days →
          </ThemedText>
        </View>
        <BarChart
          stackData={chartData}
          height={CHART_CONFIG.HEIGHT}
          width={CHART_CONFIG.WIDTH}
          spacing={20}
          barWidth={24}
          initialSpacing={20}
          endSpacing={20}
          yAxisTextStyle={axisTextStyle}
          xAxisLabelTextStyle={axisTextStyle}
          hideRules={false}
          rulesColor={chartColors.grid}
          yAxisThickness={1}
          xAxisThickness={1}
          yAxisColor={chartColors.grid}
          xAxisColor={chartColors.grid}
          animationDuration={CHART_CONFIG.ANIMATION_DURATION}
          isAnimated
          formatYLabel={formatLargeNumber}
          showLine
          lineConfig={{
            color: chartColors.primary,
            thickness: 3,
            curved: true,
            hideDataPoints: false,
            dataPointsColor: chartColors.primary,
            dataPointsRadius: 3,
            shiftY: 0,
          }}
          lineData={lineData}
          scrollToEnd={false}
          showScrollIndicator={true}
        />
      </View>

      {/* Category Legend */}
      <View style={commonChartStyles.legend}>
        <ThemedText style={styles.legendTitle}>Categories</ThemedText>
        <View style={styles.legendGrid}>
          {categories.map((category) => (
            <View key={category.id} style={styles.legendItem}>
              <View
                style={[
                  commonChartStyles.legendColorSmall,
                  { backgroundColor: category.color },
                ]}
              />
              <ThemedText style={styles.legendText} numberOfLines={1}>
                {category.name}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>

      {/* Balance Line Legend */}
      <View style={styles.balanceLegend}>
        <View style={styles.balanceItem}>
          <View
            style={[
              styles.balanceLine,
              { backgroundColor: chartColors.primary },
            ]}
          />
          <ThemedText style={styles.legendText}>Running Balance</ThemedText>
        </View>
      </View>

      {/* Insights */}
      <View style={commonChartStyles.insightsContainer}>
        <ThemedText style={commonChartStyles.insightsTitle}>
          Monthly Insights
        </ThemedText>
        {getDailySpendingInsights(chartData, monthlyBalance).map(
          (insight, index) => (
            <ThemedText key={index} style={commonChartStyles.insightText}>
              • {insight}
            </ThemedText>
          )
        )}
      </View>
    </View>
  );
};

const MonthNavigation: React.FC<{
  currentMonth: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
}> = ({ currentMonth, onNavigate }) => {
  return (
    <View style={styles.monthNavigation}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => onNavigate('prev')}
      >
        <ThemedText style={styles.navButtonText}>‹</ThemedText>
      </TouchableOpacity>

      <ThemedText style={styles.monthTitle}>
        {currentMonth.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        })}
      </ThemedText>

      <TouchableOpacity
        style={styles.navButton}
        onPress={() => onNavigate('next')}
      >
        <ThemedText style={styles.navButtonText}>›</ThemedText>
      </TouchableOpacity>
    </View>
  );
};

const getDailyCategoryStackedData = (
  transactions: Transaction[],
  selectedMonth: Date
) => {
  const monthStart = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth(),
    1
  );
  const monthEnd = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    0
  );

  // Filter transactions for the selected month (for display)
  const monthTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= monthStart && transactionDate <= monthEnd;
  });

  // Extract all unique categories from month transactions
  const categoryMap = new Map();
  const categoryColors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
    '#F8C471',
    '#82E0AA',
    '#F1948A',
    '#85929E',
    '#A9CCE3',
  ];

  monthTransactions.forEach((transaction) => {
    transaction.categories?.forEach((category) => {
      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, {
          ...category,
          color:
            category.color ||
            categoryColors[categoryMap.size % categoryColors.length],
        });
      }
    });
  });

  const categories = Array.from(categoryMap.values());

  // Calculate running balance from the beginning of all time up to each day
  // First, sort ALL transactions by date
  const allTransactionsSorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate balance up to the start of the month
  let runningBalance = 0;
  allTransactionsSorted.forEach((transaction) => {
    const transactionDate = new Date(transaction.date);
    if (transactionDate < monthStart) {
      // Only process transactions before the selected month
      if (transaction.type === 'income') {
        runningBalance += transaction.amount;
      } else if (transaction.type === 'expense') {
        runningBalance -= transaction.amount;
      }
    }
  });

  // Initialize balance at the start of the month
  const startOfMonthBalance = runningBalance;

  // Group transactions by day for the selected month
  const dailyData = new Map<number, DailyData>();

  // Initialize all days of the month with the starting balance
  for (let day = 1; day <= monthEnd.getDate(); day++) {
    dailyData.set(day, {
      date: `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      day,
      stacks: [],
      balance: startOfMonthBalance,
      totalSpent: 0,
      label: day.toString(),
    });
  }

  // Process transactions for the selected month day by day to build correct daily balances
  const dailyBalances = new Map<number, number>();
  let currentBalance = startOfMonthBalance;

  // First pass: calculate balance changes for each day
  for (let day = 1; day <= monthEnd.getDate(); day++) {
    const dayStart = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth(),
      day
    );
    const dayEnd = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth(),
      day + 1
    );

    // Get all transactions for this specific day
    const dayTransactions = monthTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= dayStart && transactionDate < dayEnd;
    });

    // Calculate balance change for this day
    let dayBalanceChange = 0;
    const dayData = dailyData.get(day)!;

    dayTransactions.forEach((transaction) => {
      if (transaction.type === 'income') {
        dayBalanceChange += transaction.amount;
      } else if (transaction.type === 'expense') {
        dayBalanceChange -= transaction.amount;
        dayData.totalSpent += transaction.amount;

        // Add category stacks for expenses
        transaction.categories?.forEach((category) => {
          const categoryInfo = categoryMap.get(category.id);
          if (categoryInfo) {
            const existingStack = dayData.stacks.find(
              (stack) => stack.categoryId === category.id
            );

            if (existingStack) {
              existingStack.value += transaction.amount;
            } else {
              dayData.stacks.push({
                value: transaction.amount,
                color: categoryInfo.color,
                categoryId: category.id,
                categoryName: category.name,
              });
            }
          }
        });
      }
    });

    // Update current balance and store it
    currentBalance += dayBalanceChange;
    dailyBalances.set(day, currentBalance);
    dayData.balance = currentBalance;
  }

  // Update runningBalance to the final balance
  runningBalance = currentBalance;

  // Convert to chart format
  const chartData = Array.from(dailyData.values())
    .filter((data) => data.stacks.length > 0) // Only show days with expenses
    .map((dayData) => ({
      stacks: dayData.stacks.map((stack) => ({
        value: stack.value,
        color: stack.color,
      })),
      label: dayData.label,
      spacing: 20,
    }));

  // Create line data for balance
  const lineData = Array.from(dailyData.values())
    .filter((data) => data.stacks.length > 0) // Match the bar chart days
    .map((dayData) => ({
      value: dayData.balance,
    }));

  // Calculate monthly balance summary
  const monthlyBalance = {
    startBalance: startOfMonthBalance,
    endBalance: runningBalance,
    totalSpent: Array.from(dailyData.values()).reduce(
      (sum, day) => sum + day.totalSpent,
      0
    ),
    spendingDays: chartData.length,
  };

  return {
    chartData,
    lineData,
    monthlyBalance,
    categories,
  };
};

const getDailySpendingInsights = (
  chartData: any[],
  monthlyBalance: any
): string[] => {
  if (chartData.length === 0) return ['No spending data for this month'];

  const insights: string[] = [];

  // Balance insights
  const balanceChange = monthlyBalance.endBalance - monthlyBalance.startBalance;
  if (balanceChange > 0) {
    insights.push(
      `Balance increased by ${formatLargeNumber(balanceChange)} this month 📈`
    );
  } else if (balanceChange < 0) {
    insights.push(
      `Balance decreased by ${formatLargeNumber(Math.abs(balanceChange))} this month 📉`
    );
  } else {
    insights.push('Balance remained unchanged this month');
  }

  // Spending frequency
  insights.push(
    `Spent money on ${monthlyBalance.spendingDays} days this month`
  );

  // Total spending
  insights.push(
    `Total spending: ${formatLargeNumber(monthlyBalance.totalSpent)}`
  );

  // Average daily spending (only on days with expenses)
  const avgDailySpending =
    monthlyBalance.totalSpent / monthlyBalance.spendingDays;
  insights.push(
    `Average daily spending: ${formatLargeNumber(avgDailySpending)}`
  );

  // Find highest spending day
  const dailyTotals = chartData.map((day) =>
    day.stacks.reduce((sum: number, stack: any) => sum + stack.value, 0)
  );
  const maxSpending = Math.max(...dailyTotals);
  const maxSpendingIndex = dailyTotals.indexOf(maxSpending);

  if (maxSpending > 0) {
    insights.push(
      `Highest spending day: Day ${chartData[maxSpendingIndex].label} (${formatLargeNumber(maxSpending)})`
    );
  }

  return insights;
};

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: 'flex-start',
    marginVertical: 16,
    width: '100%',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  navButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  legendTitle: {
    fontSize: CHART_TYPOGRAPHY.SUBTITLE,
    fontWeight: CHART_TYPOGRAPHY.SUBTITLE_WEIGHT,
    textAlign: 'center',
    marginBottom: 8,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
    marginVertical: 2,
  },
  legendText: {
    fontSize: CHART_TYPOGRAPHY.SMALL_LABEL,
    fontWeight: CHART_TYPOGRAPHY.LABEL_WEIGHT,
    maxWidth: 80,
  },
  balanceLegend: {
    alignItems: 'center',
    marginTop: 12,
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLine: {
    width: 20,
    height: 3,
    marginRight: 8,
    borderRadius: 1.5,
  },
  scrollHint: {
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  scrollHintText: {
    fontSize: CHART_TYPOGRAPHY.SMALL_LABEL,
    opacity: 0.6,
    fontStyle: 'italic',
  },
});
