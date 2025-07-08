import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Transaction, Category } from '~/types';
import { useTheme } from '~/theme';
import { formatLargeNumber } from '~/utils/formatNumbers';
import ThemedText from '~/components/themed/ThemedText';
import { PRESET_CATEGORY_COLORS } from '~/constants';
import {
  CHART_CONFIG,
  commonChartStyles,
  getChartColors,
  getChartTextStyle,
  CHART_SPACING,
  CHART_TYPOGRAPHY,
} from './chartStyles';

export type CategoryHistoricalAnalysisChartProps = {
  expenses: Transaction[];
};

type MonthlyData = {
  value: number;
  label: string;
  frontColor?: string;
  year: number;
  monthNumber: number;
  monthKey: string;
};

type CategoryData = {
  category: Category;
  monthlyData: MonthlyData[];
  totalSpent: number;
  averageMonthly: number;
  highestMonth: MonthlyData | null;
  lowestMonth: MonthlyData | null;
};

export const CategoryHistoricalAnalysisChart: React.FC<
  CategoryHistoricalAnalysisChartProps
> = ({ expenses }) => {
  const { theme, isDark } = useTheme();
  const chartColors = getChartColors(theme);
  const axisTextStyle = getChartTextStyle(theme, 'axis');

  // Helper function to get category color with theme-aware fallback
  const getCategoryColor = (category: Category): string => {
    if (category.color) return category.color;

    // Use theme-aware fallback colors for better contrast
    return isDark
      ? PRESET_CATEGORY_COLORS[0] // Coral Red for dark mode
      : '#2E86AB'; // Dark blue for light mode (better contrast)
  };

  // Get all categories that have expenses, sorted by transaction count
  const availableCategories = useMemo(() => {
    const categoryMap = new Map<
      number,
      { category: Category; count: number }
    >();
    expenses.forEach((expense) => {
      expense.categories?.forEach((category) => {
        const existing = categoryMap.get(category.id);
        if (existing) {
          existing.count += 1;
        } else {
          categoryMap.set(category.id, { category, count: 1 });
        }
      });
    });
    return Array.from(categoryMap.values())
      .sort((a, b) => b.count - a.count) // Sort by transaction count descending
      .map((item) => item.category);
  }, [expenses]);

  // Default to first category if available
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    availableCategories.length > 0 ? availableCategories[0].id : null
  );

  const categoryData = useMemo(() => {
    if (!selectedCategoryId) return null;
    const data = getCategoryHistoricalData(expenses, selectedCategoryId);
    if (!data) return null;

    // Add color to each bar for consistent theming
    const categoryColor = getCategoryColor(data.category);
    data.monthlyData = data.monthlyData.map((month) => ({
      ...month,
      frontColor: categoryColor,
    }));

    return data;
  }, [expenses, selectedCategoryId, isDark]);

  if (availableCategories.length === 0) {
    return (
      <View style={commonChartStyles.emptyContainer}>
        <ThemedText style={commonChartStyles.emptyText}>
          No category data available
        </ThemedText>
      </View>
    );
  }

  if (!categoryData) {
    return (
      <View style={commonChartStyles.emptyContainer}>
        <ThemedText style={commonChartStyles.emptyText}>
          No data available for selected category
        </ThemedText>
      </View>
    );
  }

  const maxValue =
    Math.max(...categoryData.monthlyData.map((d) => d.value), 0) * 1.2;

  return (
    <View style={commonChartStyles.container}>
      {/* Category Selector */}
      <View style={styles.categorySelector}>
        <ThemedText style={styles.selectorLabel}>Select Category:</ThemedText>
        <View style={styles.categoryGrid}>
          {availableCategories.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => setSelectedCategoryId(category.id)}
              style={[
                styles.categoryChip,
                selectedCategoryId === category.id &&
                  styles.selectedCategoryChip,
              ]}
            >
              <View
                style={[
                  styles.categoryColorDot,
                  { backgroundColor: getCategoryColor(category) },
                ]}
              />
              <ThemedText
                style={[
                  styles.categoryChipText,
                  selectedCategoryId === category.id &&
                    styles.selectedCategoryChipText,
                ]}
                numberOfLines={1}
              >
                {category.name}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Chart */}
      <BarChart
        data={categoryData.monthlyData}
        height={CHART_CONFIG.HEIGHT}
        width={CHART_CONFIG.WIDTH}
        spacing={categoryData.monthlyData.length > 12 ? 20 : 30}
        barWidth={
          categoryData.monthlyData.length > 12
            ? CHART_CONFIG.BAR_WIDTH * 0.8
            : CHART_CONFIG.BAR_WIDTH
        }
        hideRules={false}
        rulesColor={chartColors.grid}
        yAxisTextStyle={axisTextStyle}
        xAxisLabelTextStyle={axisTextStyle}
        animationDuration={CHART_CONFIG.ANIMATION_DURATION}
        isAnimated
        formatYLabel={formatLargeNumber}
        maxValue={maxValue}
        noOfSections={5}
        roundedTop
        roundedBottom
        showGradient
        gradientColor={getCategoryColor(categoryData.category)}
      />

      {/* Insights */}
      <View style={styles.insightsContainer}>
        <ThemedText style={styles.insightTitle}>
          {categoryData.category.name} Historical Analysis
        </ThemedText>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>Total Spent</ThemedText>
            <ThemedText style={styles.statValue}>
              {formatLargeNumber(categoryData.totalSpent)}
            </ThemedText>
          </View>

          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>Monthly Average</ThemedText>
            <ThemedText style={styles.statValue}>
              {formatLargeNumber(categoryData.averageMonthly)}
            </ThemedText>
          </View>
        </View>

        {categoryData.highestMonth && (
          <View style={styles.extremeMonth}>
            <ThemedText style={styles.extremeLabel}>Highest Month:</ThemedText>
            <ThemedText style={styles.extremeValue}>
              {categoryData.highestMonth.label}{' '}
              {formatLargeNumber(categoryData.highestMonth.value)}
            </ThemedText>
          </View>
        )}

        {categoryData.lowestMonth && categoryData.lowestMonth.value > 0 && (
          <View style={styles.extremeMonth}>
            <ThemedText style={styles.extremeLabel}>Lowest Month:</ThemedText>
            <ThemedText style={styles.extremeValue}>
              {categoryData.lowestMonth.label}{' '}
              {formatLargeNumber(categoryData.lowestMonth.value)}
            </ThemedText>
          </View>
        )}

        <ThemedText style={styles.periodText}>
          Showing {categoryData.monthlyData.length} months of data
        </ThemedText>
      </View>
    </View>
  );
};

const getCategoryHistoricalData = (
  expenses: Transaction[],
  categoryId: number
): CategoryData | null => {
  // Find the category
  let targetCategory: Category | null = null;
  for (const expense of expenses) {
    const found = expense.categories?.find((cat) => cat.id === categoryId);
    if (found) {
      targetCategory = found;
      break;
    }
  }

  if (!targetCategory) return null;

  // Filter expenses for this category
  const categoryExpenses = expenses.filter((expense) =>
    expense.categories?.some((cat) => cat.id === categoryId)
  );

  if (categoryExpenses.length === 0) return null;

  // Group by month-year
  const monthlySpending = new Map<string, number>();

  categoryExpenses.forEach((expense) => {
    const date = new Date(expense.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const current = monthlySpending.get(monthKey) || 0;
    monthlySpending.set(monthKey, current + expense.amount);
  });

  // Get date range
  const dates = categoryExpenses.map((e) => new Date(e.date));
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  // Generate all months in range
  const monthlyData: MonthlyData[] = [];
  const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  while (current <= end) {
    const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
    const value = monthlySpending.get(monthKey) || 0;
    const label = current.toLocaleDateString('en-US', {
      month: 'short',
      year:
        current.getFullYear() !== new Date().getFullYear()
          ? '2-digit'
          : undefined,
    });

    monthlyData.push({
      monthKey,
      value,
      label,
      year: current.getFullYear(),
      monthNumber: current.getMonth() + 1,
    });

    current.setMonth(current.getMonth() + 1);
  }

  // Calculate statistics
  const totalSpent = monthlyData.reduce((sum, month) => sum + month.value, 0);
  const nonZeroMonths = monthlyData.filter((month) => month.value > 0);
  const averageMonthly =
    nonZeroMonths.length > 0 ? totalSpent / nonZeroMonths.length : 0;

  const highestMonth = monthlyData.reduce(
    (highest, month) => (month.value > (highest?.value || 0) ? month : highest),
    null as MonthlyData | null
  );

  const lowestMonth = nonZeroMonths.reduce(
    (lowest, month) =>
      month.value < (lowest?.value || Infinity) ? month : lowest,
    null as MonthlyData | null
  );

  return {
    category: targetCategory,
    monthlyData,
    totalSpent,
    averageMonthly,
    highestMonth,
    lowestMonth,
  };
};

const styles = StyleSheet.create({
  categorySelector: {
    marginBottom: CHART_SPACING.XL,
    width: '100%',
  },
  selectorLabel: {
    fontSize: CHART_TYPOGRAPHY.SUBTITLE,
    fontWeight: CHART_TYPOGRAPHY.SUBTITLE_WEIGHT,
    marginBottom: CHART_SPACING.SM,
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: CHART_SPACING.SM,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CHART_SPACING.MD,
    paddingVertical: CHART_SPACING.SM,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  selectedCategoryChip: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0,122,255,0.1)',
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: CHART_TYPOGRAPHY.SMALL_LABEL,
    fontWeight: CHART_TYPOGRAPHY.LABEL_WEIGHT,
  },
  selectedCategoryChipText: {
    fontWeight: CHART_TYPOGRAPHY.SUBTITLE_WEIGHT,
    color: '#007AFF',
  },
  insightsContainer: {
    marginTop: CHART_SPACING.LG,
    width: '100%',
    paddingHorizontal: CHART_SPACING.SM,
  },
  insightTitle: {
    fontSize: CHART_TYPOGRAPHY.SUBTITLE,
    fontWeight: CHART_TYPOGRAPHY.SUBTITLE_WEIGHT,
    textAlign: 'center',
    marginBottom: CHART_SPACING.MD,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: CHART_SPACING.MD,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: CHART_TYPOGRAPHY.SMALL_LABEL,
    opacity: CHART_TYPOGRAPHY.MUTED_OPACITY,
    marginBottom: 4,
  },
  statValue: {
    fontSize: CHART_TYPOGRAPHY.LABEL,
    fontWeight: CHART_TYPOGRAPHY.SUBTITLE_WEIGHT,
  },
  extremeMonth: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: CHART_SPACING.XS,
    paddingHorizontal: CHART_SPACING.SM,
  },
  extremeLabel: {
    fontSize: CHART_TYPOGRAPHY.SMALL_LABEL,
    opacity: CHART_TYPOGRAPHY.MUTED_OPACITY,
  },
  extremeValue: {
    fontSize: CHART_TYPOGRAPHY.SMALL_LABEL,
    fontWeight: CHART_TYPOGRAPHY.SUBTITLE_WEIGHT,
  },
  periodText: {
    fontSize: CHART_TYPOGRAPHY.SMALL_LABEL,
    opacity: CHART_TYPOGRAPHY.SECONDARY_OPACITY,
    textAlign: 'center',
    marginTop: CHART_SPACING.SM,
    fontStyle: 'italic',
  },
});
