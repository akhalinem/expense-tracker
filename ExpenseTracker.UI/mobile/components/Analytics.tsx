import { FC, useMemo, useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { Transaction } from '~/types';
import ThemedView from '~/components/themed/ThemedView';
import ThemedText from '~/components/themed/ThemedText';
import ThemedCard from '~/components/themed/ThemedCard';
import ChartSelector, { ChartOption } from './ChartSelector';
import { useTheme } from '~/theme';
import { TopCategoriesChart } from './charts/TopCategoriesChart';
import { MonthlySpendingTrendChart } from './charts/MonthlySpendingTrendChart';
import { CategorySpendingTrendsChart } from './charts/CategorySpendingTrendsChart';
import { MonthOverMonthChart } from './charts/MonthOverMonthChart';
import { DailySpendingPatternChart } from './charts/DailySpendingPatternChart';
import { WeeklySpendingVelocityChart } from './charts/WeeklySpendingVelocityChart';
import { TopExpensesTimelineChart } from './charts/TopExpensesTimelineChart';
import { CategoryFrequencyAnalysisChart } from './charts/CategoryFrequencyAnalysisChart';
import { SpendingConcentrationChart } from './charts/SpendingConcentrationChart';
import { CategoryGrowthRateChart } from './charts/CategoryGrowthRateChart';
import { ExpenseRecurrencePatternChart } from './charts/ExpenseRecurrencePatternChart';
import { CumulativeBalanceTrendChart } from './charts/CumulativeBalanceTrendChart';
import { MonthlyTransactionCountChart } from './charts/MonthlyTransactionCountChart';
import { CategoryHistoricalAnalysisChart } from './charts/CategoryHistoricalAnalysisChart';
import { DailyCategoryStackedChart } from './charts/DailyCategoryStackedChart';
import { MonthlyCategoryBreakdownChart } from './charts/MonthlyCategoryBreakdownChart';

export const Analytics: FC<{ transactions: Transaction[] }> = ({
  transactions,
}) => {
  const { theme } = useTheme();
  const [showChartSelector, setShowChartSelector] = useState(false);
  const [selectedCharts, setSelectedCharts] = useState<string[]>([
    'monthly-category-breakdown',
    'daily-category-stacked',
  ]);

  const expenses = useMemo(
    () => transactions.filter((transaction) => transaction.type === 'expense'),
    [transactions]
  );

  // Define all available charts with their metadata
  const allChartOptions: ChartOption[] = useMemo(
    () => [
      // Overview Section
      {
        id: 'top-categories',
        title: 'Top 5 Spending Categories',
        description: 'Your biggest spending categories of all time',
        section: '📊 Financial Overview',
      },
      {
        id: 'monthly-category-breakdown',
        title: 'Monthly Category Breakdown',
        description:
          'Interactive pie chart showing category spending for any month with toggle controls',
        section: '📊 Financial Overview',
      },

      // Trend Analysis Section
      {
        id: 'daily-category-stacked',
        title: 'Daily Category Spending with Balance',
        description:
          'Monthly view of daily spending by category with running balance line',
        section: '📈 Spending Trends',
      },
      {
        id: 'cumulative-balance-trend',
        title: 'Balance Trend Over Time',
        description: 'See how your balance changes with each transaction',
        section: '📈 Spending Trends',
      },
      {
        id: 'monthly-spending-trend',
        title: 'Monthly Spending Trend',
        description: 'Track your overall spending trajectory over time',
        section: '📈 Spending Trends',
      },
      {
        id: 'month-over-month',
        title: 'Month-over-Month Comparison',
        description: 'Compare spending changes between recent months',
        section: '📈 Spending Trends',
      },
      {
        id: 'category-spending-trends',
        title: 'Category Spending Trends',
        description: 'See how spending in each category changes over time',
        section: '📈 Spending Trends',
      },
      {
        id: 'category-growth-rate',
        title: 'Category Growth Rate',
        description:
          'Identify categories with increasing or decreasing spending',
        section: '📈 Spending Trends',
      },

      // Behavioral Patterns Section
      {
        id: 'daily-spending-pattern',
        title: 'Daily Spending Pattern',
        description: 'Discover which days of the week you spend the most',
        section: '🕐 Spending Patterns',
      },
      {
        id: 'weekly-spending-velocity',
        title: 'Weekly Spending Velocity',
        description: 'See how your spending pace varies throughout each month',
        section: '🕐 Spending Patterns',
      },
      {
        id: 'expense-recurrence-pattern',
        title: 'Expense Recurrence Pattern',
        description: 'Calendar heatmap showing spending intensity by date',
        section: '🕐 Spending Patterns',
      },

      // Deep Analysis Section
      {
        id: 'category-historical-analysis',
        title: 'Category Historical Analysis',
        description:
          'View complete spending history for any category across all time periods',
        section: '🔍 Deep Analysis',
      },
      {
        id: 'monthly-transaction-count',
        title: 'Monthly Transaction Count',
        description: 'Track the volume of transactions per month',
        section: '🔍 Deep Analysis',
      },
      {
        id: 'category-frequency-analysis',
        title: 'Category Frequency Analysis',
        description:
          'Understanding the relationship between frequency and spending amount',
        section: '🔍 Deep Analysis',
      },
      {
        id: 'spending-concentration',
        title: 'Spending Concentration Analysis',
        description:
          'Pareto analysis: Which categories consume most of your budget?',
        section: '🔍 Deep Analysis',
      },

      // Individual Insights Section
      {
        id: 'top-expenses-timeline',
        title: 'Top Expenses Timeline',
        description:
          'Review your largest individual expenses over recent months',
        section: '💰 Individual Insights',
      },
    ],
    []
  );

  // Create chart configuration mapping
  const chartConfigurations = useMemo(() => {
    const configs: Record<
      string,
      {
        type: AnalyticsItemType;
        title: string;
        description: string;
        renderer: React.ComponentType<any>;
        rendererParams?: Record<string, any>;
      }
    > = {
      'top-categories': {
        type: AnalyticsItemType.CHART_CARD,
        title: 'Top 5 Spending Categories',
        description: 'Your biggest spending categories of all time',
        renderer: TopCategoriesChart,
        rendererParams: { expenses },
      },
      'monthly-category-breakdown': {
        type: AnalyticsItemType.CHART_CARD,
        title: 'Monthly Category Breakdown',
        description:
          'Interactive pie chart showing category spending for any month with toggle controls',
        renderer: MonthlyCategoryBreakdownChart,
        rendererParams: { transactions },
      },
      'daily-category-stacked': {
        type: AnalyticsItemType.CHART_CARD,
        title: 'Daily Category Spending with Balance',
        description:
          'Monthly view of daily spending by category with running balance line',
        renderer: DailyCategoryStackedChart,
        rendererParams: { transactions },
      },
      'cumulative-balance-trend': {
        type: AnalyticsItemType.CHART_CARD,
        title: 'Balance Trend Over Time',
        description: 'See how your balance changes with each transaction',
        renderer: CumulativeBalanceTrendChart,
        rendererParams: { transactions, daysToShow: 30 },
      },
      'monthly-spending-trend': {
        type: AnalyticsItemType.CHART_CARD,
        title: 'Monthly Spending Trend',
        description: 'Track your overall spending trajectory over time',
        renderer: MonthlySpendingTrendChart,
        rendererParams: { expenses, monthsToShow: 6 },
      },
      'month-over-month': {
        type: AnalyticsItemType.CHART_CARD,
        title: 'Month-over-Month Comparison',
        description: 'Compare spending changes between recent months',
        renderer: MonthOverMonthChart,
        rendererParams: { expenses, monthsToShow: 5 },
      },
      'category-spending-trends': {
        type: AnalyticsItemType.CHART_CARD,
        title: 'Category Spending Trends',
        description: 'See how spending in each category changes over time',
        renderer: CategorySpendingTrendsChart,
        rendererParams: { expenses, monthsToShow: 6, topCategoriesCount: 5 },
      },
      'category-growth-rate': {
        type: AnalyticsItemType.CHART_CARD,
        title: 'Category Growth Rate',
        description:
          'Identify categories with increasing or decreasing spending',
        renderer: CategoryGrowthRateChart,
        rendererParams: { expenses, topCategoriesCount: 8 },
      },
      'daily-spending-pattern': {
        type: AnalyticsItemType.CHART_CARD,
        title: 'Daily Spending Pattern',
        description: 'Discover which days of the week you spend the most',
        renderer: DailySpendingPatternChart,
        rendererParams: { expenses },
      },
      'weekly-spending-velocity': {
        type: AnalyticsItemType.CHART_CARD,
        title: 'Weekly Spending Velocity',
        description: 'See how your spending pace varies throughout each month',
        renderer: WeeklySpendingVelocityChart,
        rendererParams: { expenses, monthsToShow: 3 },
      },
      'expense-recurrence-pattern': {
        type: AnalyticsItemType.CHART_CARD,
        title: 'Expense Recurrence Pattern',
        description: 'Calendar heatmap showing spending intensity by date',
        renderer: ExpenseRecurrencePatternChart,
        rendererParams: { expenses, monthsToShow: 3 },
      },
      'category-historical-analysis': {
        type: AnalyticsItemType.CHART_CARD,
        title: 'Category Historical Analysis',
        description:
          'View complete spending history for any category across all time periods',
        renderer: CategoryHistoricalAnalysisChart,
        rendererParams: { expenses },
      },
      'monthly-transaction-count': {
        type: AnalyticsItemType.CHART_CARD,
        title: 'Monthly Transaction Count',
        description: 'Track the volume of transactions per month',
        renderer: MonthlyTransactionCountChart,
        rendererParams: { transactions, monthsToShow: 6 },
      },
      'category-frequency-analysis': {
        type: AnalyticsItemType.CHART_CARD,
        title: 'Category Frequency Analysis',
        description:
          'Understanding the relationship between frequency and spending amount',
        renderer: CategoryFrequencyAnalysisChart,
        rendererParams: { expenses, topCategoriesCount: 8 },
      },
      'spending-concentration': {
        type: AnalyticsItemType.CHART_CARD,
        title: 'Spending Concentration Analysis',
        description:
          'Pareto analysis: Which categories consume most of your budget?',
        renderer: SpendingConcentrationChart,
        rendererParams: { expenses },
      },
      'top-expenses-timeline': {
        type: AnalyticsItemType.CHART_CARD,
        title: 'Top Expenses Timeline',
        description:
          'Review your largest individual expenses over recent months',
        renderer: TopExpensesTimelineChart,
        rendererParams: { expenses, topCount: 10, periodInDays: 90 },
      },
    };
    return configs;
  }, [expenses, transactions]);

  // Generate analytics data based on selected charts
  const analyticsData: AnalyticsItem[] = useMemo(() => {
    const data: AnalyticsItem[] = [];

    // Group selected charts by section
    const chartsBySection = selectedCharts.reduce(
      (acc, chartId) => {
        const chartOption = allChartOptions.find((opt) => opt.id === chartId);
        if (chartOption) {
          if (!acc[chartOption.section]) {
            acc[chartOption.section] = [];
          }
          acc[chartOption.section].push(chartId);
        }
        return acc;
      },
      {} as Record<string, string[]>
    );

    // Build analytics data with section headers
    Object.entries(chartsBySection).forEach(([sectionName, chartIds]) => {
      // Add section header
      data.push({
        type: AnalyticsItemType.SECTION_HEADER,
        id: `${sectionName}-header`,
        title: sectionName,
      });

      // Add charts for this section
      chartIds.forEach((chartId) => {
        const config = chartConfigurations[chartId];
        if (config) {
          data.push({
            type: config.type,
            id: chartId,
            title: config.title,
            description: config.description,
            renderer: config.renderer,
            rendererParams: config.rendererParams,
          } as AnalyticsItem);
        }
      });
    });

    return data;
  }, [selectedCharts, allChartOptions, chartConfigurations]);

  return (
    <ThemedView style={styles.container}>
      {/* Header with chart selector button */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Analytics</ThemedText>
        <Pressable
          style={[styles.selectorButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowChartSelector(true)}
        >
          <ThemedText style={[styles.selectorButtonText, { color: '#fff' }]}>
            ⚙️ Select Charts ({selectedCharts.length})
          </ThemedText>
        </Pressable>
      </View>

      {/* Empty state when no charts selected */}
      {selectedCharts.length === 0 ? (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyStateTitle}>
            No Charts Selected
          </ThemedText>
          <ThemedText style={styles.emptyStateDescription}>
            Tap "Select Charts" to choose which analytics you'd like to see
          </ThemedText>
          <Pressable
            style={[
              styles.selectChartsButton,
              { backgroundColor: theme.primary },
            ]}
            onPress={() => setShowChartSelector(true)}
          >
            <ThemedText
              style={[styles.selectChartsButtonText, { color: '#fff' }]}
            >
              Select Charts
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={analyticsData}
          renderItem={AnalyticsItemRenderer}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      {/* Chart Selector Modal */}
      {showChartSelector && (
        <ChartSelector
          chartOptions={allChartOptions}
          selectedCharts={selectedCharts}
          onSelectionChange={setSelectedCharts}
          onClose={() => setShowChartSelector(false)}
        />
      )}
    </ThemedView>
  );
};

// Types for our analytics sections
enum AnalyticsItemType {
  SECTION_HEADER = 'SECTION_HEADER',
  CHART_CARD = 'CHART_CARD',
}

type AnalyticsItem =
  | {
      type: AnalyticsItemType.SECTION_HEADER;
      id: string;
      title: string;
    }
  | {
      type: AnalyticsItemType.CHART_CARD;
      id: string;
      title: string;
      description?: string;
      renderer: React.ComponentType<any>;
      rendererParams?: Record<string, any>;
    };

const keyExtractor = (item: AnalyticsItem) => item.id;

const AnalyticsItemRenderer = ({ item }: ListRenderItemInfo<AnalyticsItem>) => {
  if (item.type === AnalyticsItemType.SECTION_HEADER) {
    return <SectionHeader title={item.title} />;
  }

  const Renderer = item.renderer;
  const rendererParams = item.rendererParams || {};

  return (
    <CardSection title={item.title} description={item.description}>
      <Renderer {...rendererParams} />
    </CardSection>
  );
};

const CardSection: FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => {
  return (
    <ThemedCard style={{ marginBottom: 16 }}>
      <ThemedText style={styles.cardTitle}>{title}</ThemedText>
      {description && (
        <ThemedText style={styles.cardDescription}>{description}</ThemedText>
      )}
      {children}
    </ThemedCard>
  );
};

const SectionHeader: FC<{ title: string }> = ({ title }) => {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    </View>
  );
};

const getCurrentMonthTransactions = (
  transactions: Transaction[]
): Transaction[] => {
  const currentMonthsTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    const currentDate = new Date();
    return (
      transactionDate.getMonth() === currentDate.getMonth() &&
      transactionDate.getFullYear() === currentDate.getFullYear()
    );
  });

  return currentMonthsTransactions;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  selectorButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectorButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  selectChartsButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  selectChartsButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  cardDescription: {
    fontSize: 13,
    opacity: 0.65,
    marginBottom: 12,
    lineHeight: 18,
  },
  sectionHeader: {
    marginVertical: 24,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
});
