import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Category, Transaction } from '~/types';
import { PRESET_CATEGORY_COLORS } from '~/constants';
import { useTheme } from '~/theme';
import { formatLargeNumber } from '~/utils/formatNumbers';
import ThemedText from '~/components/themed/ThemedText';
import {
  CHART_CONFIG,
  CHART_TYPOGRAPHY,
  commonChartStyles,
  getChartColors,
} from './chartStyles';

export type TopCategoryChartItem = {
  category: string;
  amount: number;
  color: string;
};

export type TopCategoriesChartProps = {
  expenses: Transaction[];
};

export const TopCategoriesChart: React.FC<TopCategoriesChartProps> = ({
  expenses,
}) => {
  const { theme } = useTheme();
  const chartColors = getChartColors(theme);

  const chartData = useMemo(
    () => getTopCategoriesChartData(expenses, 5),
    [expenses]
  );

  // Calculate total amount for percentage calculation
  const totalAmount = useMemo(
    () => chartData.reduce((sum, item) => sum + item.amount, 0),
    [chartData]
  );

  if (chartData.length === 0) {
    return (
      <View style={commonChartStyles.emptyContainer}>
        <ThemedText style={commonChartStyles.emptyText}>
          No category data available
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={commonChartStyles.container}>
      <PieChart
        data={chartData.map((item) => ({
          value: item.amount,
          color: item.color,
        }))}
        radius={CHART_CONFIG.PIE_RADIUS}
        donut
        innerRadius={CHART_CONFIG.PIE_INNER_RADIUS}
        paddingVertical={CHART_CONFIG.CHART_PADDING}
        paddingHorizontal={CHART_CONFIG.CHART_PADDING}
        strokeColor={chartColors.surface}
        strokeWidth={CHART_CONFIG.PIE_STROKE_WIDTH}
        showText
        textColor={chartColors.surface}
        textSize={CHART_TYPOGRAPHY.SMALL_LABEL}
        fontWeight={CHART_TYPOGRAPHY.SUBTITLE_WEIGHT}
        showTextBackground
        textBackgroundRadius={6}
        innerCircleColor={theme.surface}
        centerLabelComponent={() => (
          <View>
            <ThemedText style={commonChartStyles.centerLabel}>Total</ThemedText>
            <ThemedText style={commonChartStyles.centerValue}>
              {formatLargeNumber(totalAmount)}
            </ThemedText>
          </View>
        )}
      />

      <View style={commonChartStyles.legend}>
        {chartData.map((item, index) => {
          const percentage =
            totalAmount > 0
              ? ((item.amount / totalAmount) * 100).toFixed(1)
              : '0.0';
          return (
            <View key={index} style={commonChartStyles.legendItem}>
              <View
                style={[
                  commonChartStyles.legendColor,
                  { backgroundColor: item.color },
                ]}
              />
              <View style={styles.legendText}>
                <ThemedText style={commonChartStyles.legendText}>
                  {item.category}
                </ThemedText>
                <ThemedText style={commonChartStyles.legendTextSecondary}>
                  {formatLargeNumber(item.amount)} ({percentage}%)
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const getTopCategoriesChartData = (
  expenses: Transaction[],
  top: number = expenses.length
): TopCategoryChartItem[] => {
  const categorizedExpensesMap = new Map<number, Transaction[]>();
  const allCategoriesMapById = new Map<number, Category>();

  expenses.forEach((transaction) => {
    const categories = transaction.categories || [];
    categories.forEach((category) => {
      if (!allCategoriesMapById.has(category.id)) {
        allCategoriesMapById.set(category.id, category);
      }

      if (!categorizedExpensesMap.has(category.id)) {
        categorizedExpensesMap.set(category.id, []);
      }
      categorizedExpensesMap.get(category.id)!.push(transaction);
    });
  });

  const categoryTotals = Array.from(categorizedExpensesMap.entries()).map(
    ([categoryId, transactions]) => {
      const totalAmount = transactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );
      const category = allCategoriesMapById.get(categoryId);
      return {
        category: category || {
          id: categoryId,
          name: 'Unknown',
          color: PRESET_CATEGORY_COLORS[0],
        },
        amount: totalAmount,
      };
    }
  );

  const pieChartData: TopCategoryChartItem[] = categoryTotals
    .map(({ category, amount }) => ({
      category: category.name,
      amount,
      color: category.color || PRESET_CATEGORY_COLORS[0],
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, top);

  return pieChartData;
};

const styles = StyleSheet.create({
  legendText: {
    flex: 1,
  },
});
