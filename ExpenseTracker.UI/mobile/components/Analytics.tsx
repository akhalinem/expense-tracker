import { FC } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Category, Transaction } from '~/types';
import { PRESET_CATEGORY_COLORS } from '~/constants';
import ThemedView from '~/components/themed/ThemedView';
import ThemedText from '~/components/themed/ThemedText';
import ThemedCard from '~/components/themed/ThemedCard';
import {
  TopCategoriesChart,
  TopCategoryChartItem,
} from './charts/TopCategoriesChart';
import { MonthlySpendingTrendChart } from './charts/MonthlySpendingTrendChart';
import { CategorySpendingTrendsChart } from './charts/CategorySpendingTrendsChart';
import { MonthOverMonthChart } from './charts/MonthOverMonthChart';

export const Analytics: FC<{ transactions: Transaction[] }> = ({
  transactions,
}) => {
  const expenses = transactions.filter(
    (transaction) => transaction.type === 'expense'
  );

  return (
    <ThemedView as={ScrollView} style={styles.container}>
      <CardSection title="Monthly Spending Trend">
        <MonthlySpendingTrendChart expenses={expenses} monthsToShow={6} />
      </CardSection>

      <CardSection title="Month-over-Month Comparison">
        <MonthOverMonthChart expenses={expenses} monthsToShow={5} />
      </CardSection>

      <CardSection title="Category Spending Trends">
        <CategorySpendingTrendsChart
          expenses={expenses}
          monthsToShow={6}
          topCategoriesCount={5}
        />
      </CardSection>

      <CardSection title="Top 5 Categories of All Time">
        <TopCategoriesChart data={getTopCategoriesChartData(expenses, 5)} />
      </CardSection>
    </ThemedView>
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

const CardSection: FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  return (
    <ThemedCard style={{ marginBottom: 16 }}>
      <ThemedText style={styles.cardTitle}>{title}</ThemedText>
      {children}
    </ThemedCard>
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
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
