import React, { useMemo, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Transaction, Category } from '~/types';
import { useTheme } from '~/theme';
import { formatLargeNumber } from '~/utils/formatNumbers';
import ThemedText from '~/components/themed/ThemedText';
import {
  CHART_CONFIG,
  CHART_TYPOGRAPHY,
  commonChartStyles,
  getChartColors,
} from './chartStyles';

export type MonthlyCategoryBreakdownChartProps = {
  transactions: Transaction[];
  selectedMonth?: Date;
};

type CategoryData = {
  id: number;
  name: string;
  color: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  enabled: boolean;
};

export const MonthlyCategoryBreakdownChart: React.FC<
  MonthlyCategoryBreakdownChartProps
> = ({ transactions, selectedMonth = new Date() }) => {
  const { theme } = useTheme();

  // State for month/year selection
  const [currentMonth, setCurrentMonth] = useState(selectedMonth);
  const [enabledCategories, setEnabledCategories] = useState<Set<number>>(
    new Set()
  );

  const { categoryData, totalAmount, filteredData, filteredTotal } =
    useMemo(() => {
      const data = getMonthlyCategoryData(transactions, currentMonth);

      // Initialize enabled categories on first load
      if (enabledCategories.size === 0 && data.length > 0) {
        const initialEnabled = new Set(data.map((cat) => cat.id));
        setEnabledCategories(initialEnabled);
        return {
          categoryData: data,
          totalAmount: data.reduce((sum, cat) => sum + cat.amount, 0),
          filteredData: data,
          filteredTotal: data.reduce((sum, cat) => sum + cat.amount, 0),
        };
      }

      const filtered = data.filter((cat) => enabledCategories.has(cat.id));
      const filteredSum = filtered.reduce((sum, cat) => sum + cat.amount, 0);

      // Recalculate percentages for filtered data
      const filteredWithPercentages = filtered.map((cat) => ({
        ...cat,
        percentage: filteredSum > 0 ? (cat.amount / filteredSum) * 100 : 0,
      }));

      return {
        categoryData: data,
        totalAmount: data.reduce((sum, cat) => sum + cat.amount, 0),
        filteredData: filteredWithPercentages,
        filteredTotal: filteredSum,
      };
    }, [transactions, currentMonth, enabledCategories]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const toggleCategory = (categoryId: number) => {
    const newEnabled = new Set(enabledCategories);
    if (newEnabled.has(categoryId)) {
      newEnabled.delete(categoryId);
    } else {
      newEnabled.add(categoryId);
    }
    setEnabledCategories(newEnabled);
  };

  const toggleAllCategories = () => {
    if (enabledCategories.size === categoryData.length) {
      // Disable all
      setEnabledCategories(new Set());
    } else {
      // Enable all
      setEnabledCategories(new Set(categoryData.map((cat) => cat.id)));
    }
  };

  if (categoryData.length === 0) {
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

      {/* Category Toggle Controls */}
      <View style={styles.controlsSection}>
        <View style={styles.controlsHeader}>
          <ThemedText style={styles.controlsTitle}>Categories</ThemedText>
          <TouchableOpacity
            style={styles.toggleAllButton}
            onPress={toggleAllCategories}
          >
            <ThemedText style={styles.toggleAllText}>
              {enabledCategories.size === categoryData.length
                ? 'Deselect All'
                : 'Select All'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryToggles}
          contentContainerStyle={styles.categoryTogglesContent}
        >
          {categoryData.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryToggle,
                {
                  backgroundColor: enabledCategories.has(category.id)
                    ? category.color
                    : 'transparent',
                  borderColor: category.color,
                },
              ]}
              onPress={() => toggleCategory(category.id)}
            >
              <ThemedText
                style={[
                  styles.categoryToggleText,
                  {
                    color: enabledCategories.has(category.id)
                      ? theme.surface
                      : category.color,
                  },
                ]}
                numberOfLines={1}
              >
                {category.name}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Pie Chart */}
      {filteredData.length > 0 ? (
        <View style={styles.chartContainer}>
          <PieChart
            data={filteredData.map((item) => ({
              value: item.amount,
              color: item.color,
              text: `${item.percentage.toFixed(1)}%`,
              textColor: theme.surface,
              textSize: 12,
            }))}
            radius={CHART_CONFIG.PIE_RADIUS}
            innerRadius={CHART_CONFIG.PIE_INNER_RADIUS}
            innerCircleColor={theme.surface}
            centerLabelComponent={() => (
              <View style={styles.centerInfo}>
                <ThemedText style={commonChartStyles.centerLabel}>
                  Total
                </ThemedText>
                <ThemedText style={commonChartStyles.centerValue}>
                  {formatLargeNumber(filteredTotal)}
                </ThemedText>
                <ThemedText style={styles.centerSubtext}>
                  {filteredData.length} categories
                </ThemedText>
              </View>
            )}
            strokeWidth={2}
            strokeColor={theme.surface}
          />
        </View>
      ) : (
        <View style={commonChartStyles.emptyContainer}>
          <ThemedText style={commonChartStyles.emptyText}>
            No categories selected
          </ThemedText>
        </View>
      )}

      {/* Category Legend with Details */}
      <View style={styles.legendSection}>
        <ThemedText style={styles.legendTitle}>Breakdown Details</ThemedText>
        <ScrollView style={styles.legend}>
          {filteredData
            .sort((a, b) => b.amount - a.amount)
            .map((category) => (
              <View key={category.id} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: category.color },
                  ]}
                />
                <View style={styles.legendDetails}>
                  <View style={styles.legendMainRow}>
                    <ThemedText
                      style={styles.legendCategoryName}
                      numberOfLines={1}
                    >
                      {category.name}
                    </ThemedText>
                    <ThemedText style={styles.legendAmount}>
                      {formatLargeNumber(category.amount)}
                    </ThemedText>
                  </View>
                  <View style={styles.legendSubRow}>
                    <ThemedText style={styles.legendPercentage}>
                      {category.percentage.toFixed(1)}% of total
                    </ThemedText>
                    <ThemedText style={styles.legendTransactionCount}>
                      {category.transactionCount} transactions
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))}
        </ScrollView>
      </View>

      {/* Summary Insights */}
      <View style={commonChartStyles.insightsContainer}>
        <ThemedText style={commonChartStyles.insightsTitle}>
          Monthly Insights
        </ThemedText>
        {getMonthlyCategoryInsights(
          filteredData,
          filteredTotal,
          currentMonth
        ).map((insight, index) => (
          <ThemedText key={index} style={commonChartStyles.insightText}>
            • {insight}
          </ThemedText>
        ))}
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

const getMonthlyCategoryData = (
  transactions: Transaction[],
  selectedMonth: Date
): CategoryData[] => {
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

  // Filter expenses for the selected month
  const monthExpenses = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    return (
      transaction.type === 'expense' &&
      transactionDate >= monthStart &&
      transactionDate <= monthEnd
    );
  });

  // Group by category
  const categoryMap = new Map<
    number,
    {
      category: Category;
      amount: number;
      transactionCount: number;
    }
  >();

  monthExpenses.forEach((expense) => {
    expense.categories?.forEach((category) => {
      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, {
          category,
          amount: 0,
          transactionCount: 0,
        });
      }
      const categoryData = categoryMap.get(category.id)!;
      categoryData.amount += expense.amount;
      categoryData.transactionCount += 1;
    });
  });

  // Calculate total for percentages
  const totalAmount = Array.from(categoryMap.values()).reduce(
    (sum, data) => sum + data.amount,
    0
  );

  // Convert to CategoryData array
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

  return Array.from(categoryMap.entries())
    .map(([categoryId, data], index) => ({
      id: categoryId,
      name: data.category.name,
      color:
        data.category.color || categoryColors[index % categoryColors.length],
      amount: data.amount,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      transactionCount: data.transactionCount,
      enabled: true,
    }))
    .sort((a, b) => b.amount - a.amount);
};

const getMonthlyCategoryInsights = (
  categoryData: CategoryData[],
  totalAmount: number,
  currentMonth: Date
): string[] => {
  if (categoryData.length === 0) return ['No spending data for this month'];

  const insights: string[] = [];

  // Top category insight
  if (categoryData.length > 0) {
    const topCategory = categoryData[0];
    insights.push(
      `Top category: ${topCategory.name} (${formatLargeNumber(topCategory.amount)} - ${topCategory.percentage.toFixed(1)}%)`
    );
  }

  // Concentration analysis
  if (categoryData.length >= 3) {
    const top3Total = categoryData
      .slice(0, 3)
      .reduce((sum, cat) => sum + cat.amount, 0);
    const top3Percentage = (top3Total / totalAmount) * 100;
    insights.push(
      `Top 3 categories account for ${top3Percentage.toFixed(1)}% of spending`
    );
  }

  // Distribution analysis
  if (categoryData.length > 1) {
    const averageSpending = totalAmount / categoryData.length;
    const aboveAverage = categoryData.filter(
      (cat) => cat.amount > averageSpending
    ).length;
    insights.push(
      `${aboveAverage} out of ${categoryData.length} categories are above average spending`
    );
  }

  // Transaction frequency insight
  const totalTransactions = categoryData.reduce(
    (sum, cat) => sum + cat.transactionCount,
    0
  );
  insights.push(
    `${totalTransactions} transactions across ${categoryData.length} categories`
  );

  // Month context
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long' });
  insights.push(`${monthName} spending: ${formatLargeNumber(totalAmount)}`);

  return insights;
};

const styles = StyleSheet.create({
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
  controlsSection: {
    flex: 1,
  },
  controlsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  controlsTitle: {
    fontSize: CHART_TYPOGRAPHY.SUBTITLE,
    fontWeight: CHART_TYPOGRAPHY.SUBTITLE_WEIGHT,
  },
  toggleAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  toggleAllText: {
    fontSize: CHART_TYPOGRAPHY.SMALL_LABEL,
    fontWeight: CHART_TYPOGRAPHY.SUBTITLE_WEIGHT,
  },
  categoryToggles: {},
  categoryTogglesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryToggle: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  categoryToggleText: {
    fontSize: CHART_TYPOGRAPHY.SMALL_LABEL,
    fontWeight: CHART_TYPOGRAPHY.SUBTITLE_WEIGHT,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  centerInfo: {
    alignItems: 'center',
  },
  centerSubtext: {
    fontSize: CHART_TYPOGRAPHY.SMALL_LABEL,
    opacity: 0.7,
    marginTop: 4,
  },
  legendSection: {
    marginTop: 20,
    paddingHorizontal: 16,
    width: '100%',
  },
  legendTitle: {
    fontSize: CHART_TYPOGRAPHY.SUBTITLE,
    fontWeight: CHART_TYPOGRAPHY.SUBTITLE_WEIGHT,
    textAlign: 'center',
    marginBottom: 16,
  },
  legend: {
    maxHeight: 200,
    overflow: 'scroll',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
    marginTop: 2,
  },
  legendDetails: {
    flex: 1,
    minWidth: 0,
  },
  legendMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  legendCategoryName: {
    fontSize: CHART_TYPOGRAPHY.LABEL,
    fontWeight: CHART_TYPOGRAPHY.SUBTITLE_WEIGHT,
    flex: 1,
    marginRight: 12,
  },
  legendAmount: {
    fontSize: CHART_TYPOGRAPHY.LABEL,
    fontWeight: CHART_TYPOGRAPHY.BOLD_WEIGHT,
    textAlign: 'right',
    minWidth: 80,
  },
  legendSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendPercentage: {
    fontSize: CHART_TYPOGRAPHY.SMALL_LABEL,
    opacity: 0.7,
    flex: 1,
  },
  legendTransactionCount: {
    fontSize: CHART_TYPOGRAPHY.SMALL_LABEL,
    opacity: 0.7,
    textAlign: 'right',
  },
});
