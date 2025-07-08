import { FC, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { Transaction } from '~/types';
import ThemedView from '~/components/themed/ThemedView';
import ThemedText from '~/components/themed/ThemedText';
import ThemedCard from '~/components/themed/ThemedCard';
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

export const Analytics: FC<{ transactions: Transaction[] }> = ({
  transactions,
}) => {
  const expenses = useMemo(
    () => transactions.filter((transaction) => transaction.type === 'expense'),
    [transactions]
  );

  const analyticsData: AnalyticsItem[] = useMemo(
    () => [
      // Overview Section
      {
        type: AnalyticsItemType.SECTION_HEADER,
        id: 'overview-header',
        title: '📊 Financial Overview',
      },
      {
        type: AnalyticsItemType.CHART_CARD,
        id: 'top-categories',
        title: 'Top 5 Spending Categories',
        description: 'Your biggest spending categories of all time',
        renderer: TopCategoriesChart,
        rendererParams: { expenses },
      },

      // Trend Analysis Section
      {
        type: AnalyticsItemType.SECTION_HEADER,
        id: 'trend-header',
        title: '📈 Spending Trends',
      },
      {
        type: AnalyticsItemType.CHART_CARD,
        id: 'cumulative-balance-trend',
        title: 'Balance Trend Over Time',
        description: 'See how your balance changes with each transaction',
        renderer: CumulativeBalanceTrendChart,
        rendererParams: { transactions, daysToShow: 30 },
      },
      {
        type: AnalyticsItemType.CHART_CARD,
        id: 'monthly-spending-trend',
        title: 'Monthly Spending Trend',
        description: 'Track your overall spending trajectory over time',
        renderer: MonthlySpendingTrendChart,
        rendererParams: { expenses, monthsToShow: 6 },
      },
      {
        type: AnalyticsItemType.CHART_CARD,
        id: 'month-over-month',
        title: 'Month-over-Month Comparison',
        description: 'Compare spending changes between recent months',
        renderer: MonthOverMonthChart,
        rendererParams: { expenses, monthsToShow: 5 },
      },
      {
        type: AnalyticsItemType.CHART_CARD,
        id: 'category-spending-trends',
        title: 'Category Spending Trends',
        description: 'See how spending in each category changes over time',
        renderer: CategorySpendingTrendsChart,
        rendererParams: { expenses, monthsToShow: 6, topCategoriesCount: 5 },
      },
      {
        type: AnalyticsItemType.CHART_CARD,
        id: 'category-growth-rate',
        title: 'Category Growth Rate',
        description:
          'Identify categories with increasing or decreasing spending',
        renderer: CategoryGrowthRateChart,
        rendererParams: { expenses, topCategoriesCount: 8 },
      },

      // Behavioral Patterns Section
      {
        type: AnalyticsItemType.SECTION_HEADER,
        id: 'patterns-header',
        title: '🕐 Spending Patterns',
      },
      {
        type: AnalyticsItemType.CHART_CARD,
        id: 'daily-spending-pattern',
        title: 'Daily Spending Pattern',
        description: 'Discover which days of the week you spend the most',
        renderer: DailySpendingPatternChart,
        rendererParams: { expenses },
      },
      {
        type: AnalyticsItemType.CHART_CARD,
        id: 'weekly-spending-velocity',
        title: 'Weekly Spending Velocity',
        description: 'See how your spending pace varies throughout each month',
        renderer: WeeklySpendingVelocityChart,
        rendererParams: { expenses, monthsToShow: 3 },
      },
      {
        type: AnalyticsItemType.CHART_CARD,
        id: 'expense-recurrence-pattern',
        title: 'Expense Recurrence Pattern',
        description: 'Calendar heatmap showing spending intensity by date',
        renderer: ExpenseRecurrencePatternChart,
        rendererParams: { expenses, monthsToShow: 3 },
      },

      // Deep Analysis Section
      {
        type: AnalyticsItemType.SECTION_HEADER,
        id: 'analysis-header',
        title: '🔍 Deep Analysis',
      },
      {
        type: AnalyticsItemType.CHART_CARD,
        id: 'category-historical-analysis',
        title: 'Category Historical Analysis',
        description:
          'View complete spending history for any category across all time periods',
        renderer: CategoryHistoricalAnalysisChart,
        rendererParams: { expenses },
      },
      {
        type: AnalyticsItemType.CHART_CARD,
        id: 'monthly-transaction-count',
        title: 'Monthly Transaction Count',
        description: 'Track the volume of transactions per month',
        renderer: MonthlyTransactionCountChart,
        rendererParams: { transactions, monthsToShow: 6 },
      },
      {
        type: AnalyticsItemType.CHART_CARD,
        id: 'category-frequency-analysis',
        title: 'Category Frequency Analysis',
        description:
          'Understanding the relationship between frequency and spending amount',
        renderer: CategoryFrequencyAnalysisChart,
        rendererParams: { expenses, topCategoriesCount: 8 },
      },
      {
        type: AnalyticsItemType.CHART_CARD,
        id: 'spending-concentration',
        title: 'Spending Concentration Analysis',
        description:
          'Pareto analysis: Which categories consume most of your budget?',
        renderer: SpendingConcentrationChart,
        rendererParams: { expenses },
      },

      // Individual Insights Section
      {
        type: AnalyticsItemType.SECTION_HEADER,
        id: 'insights-header',
        title: '💰 Individual Insights',
      },
      {
        type: AnalyticsItemType.CHART_CARD,
        id: 'top-expenses-timeline',
        title: 'Top Expenses Timeline',
        description:
          'Review your largest individual expenses over recent months',
        renderer: TopExpensesTimelineChart,
        rendererParams: { expenses, topCount: 10, periodInDays: 90 },
      },
    ],
    [expenses, transactions]
  );

  return (
    <ThemedView style={styles.container}>
      <FlashList
        data={analyticsData}
        renderItem={AnalyticsItemRenderer}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      />
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
