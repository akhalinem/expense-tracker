import { FC } from 'react';
import { StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Category, Transaction } from '~/types';
import { PRESET_CATEGORY_COLORS } from '~/constants';
import ThemedView from '~/components/themed/ThemedView';
import ThemedText from '~/components/themed/ThemedText';
import ThemedCard from '~/components/themed/ThemedCard';
import { TopCategoriesChart, TopCategoryChartItem } from './charts/TopCategoriesChart';

export const Analytics: FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const currentMonthsTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        const currentDate = new Date();
        return transactionDate.getMonth() === currentDate.getMonth() && transactionDate.getFullYear() === currentDate.getFullYear();
    });

    const topCategoriesOfCurrentMonth = getTopCategoriesChartData(currentMonthsTransactions, 5)

    return (
        <ThemedView as={ScrollView} style={styles.container}>
            <ThemedCard>
                <ThemedText style={styles.cardTitle}>Top 5 Categories</ThemedText>
                <TopCategoriesChart
                    data={topCategoriesOfCurrentMonth}
                    width={width - 40}
                    height={250}
                />
            </ThemedCard>
        </ThemedView>
    );
};

const { width } = Dimensions.get('window');

const getTopCategoriesChartData = (transactions: Transaction[], top: number = transactions.length): TopCategoryChartItem[] => {
    const expenses = transactions.filter(transaction => transaction.type === 'expense');

    const categorizedExpensesMap = new Map<number, Transaction[]>();
    const allCategoriesMapById = new Map<number, Category>();

    expenses.forEach(transaction => {
        const categories = transaction.categories || [];
        categories.forEach(category => {
            if (!allCategoriesMapById.has(category.id)) {
                allCategoriesMapById.set(category.id, category)
            }

            if (!categorizedExpensesMap.has(category.id)) {
                categorizedExpensesMap.set(category.id, []);
            }
            categorizedExpensesMap.get(category.id)!.push(transaction);
        });
    });

    const categoryTotals = Array.from(categorizedExpensesMap.entries()).map(([categoryId, transactions]) => {
        const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        const category = allCategoriesMapById.get(categoryId);
        return {
            category: category || { id: categoryId, name: 'Unknown', color: PRESET_CATEGORY_COLORS[0] },
            amount: totalAmount
        };
    });

    const pieChartData: TopCategoryChartItem[] = categoryTotals
        .map(({ category, amount }) => ({
            category: category.name,
            amount,
            color: category.color || PRESET_CATEGORY_COLORS[0]
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, top)

    return pieChartData;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8
    }
});
