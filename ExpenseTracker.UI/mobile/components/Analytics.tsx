import { FC } from 'react';
import { StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Transaction } from '~/types';
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
    const expensesByCategory = expenses
        .filter(({ categoryName }) => !!categoryName)
        .reduce((acc, transaction) => {
            const category = transaction.categoryName!;
            const amount = transaction.amount ?? 0;

            if (acc[category] === undefined) {
                acc[category] = {
                    amount: 0,
                    color: transaction.categoryColor || PRESET_CATEGORY_COLORS[0]
                };
            } else {
                acc[category].amount += amount;
            }

            return acc;
        }, {} as Record<string, { color: string; amount: number }>);

    const pieChartData: TopCategoryChartItem[] = Object.entries(expensesByCategory)
        .map(([category, { amount, color }], index) => ({
            category,
            amount,
            color
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
