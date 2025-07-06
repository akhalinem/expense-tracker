import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Transaction } from '~/types';
import { useTheme } from '~/theme';
import { formatLargeNumber } from '~/utils/formatNumbers';
import ThemedText from '~/components/themed/ThemedText';

export type CumulativeBalanceTrendChartProps = {
  transactions: Transaction[];
  daysToShow?: number;
};

type BalancePoint = {
  value: number;
  date: Date;
  label: string;
  runningBalance: number;
  transaction?: Transaction;
};

export const CumulativeBalanceTrendChart: React.FC<
  CumulativeBalanceTrendChartProps
> = ({ transactions, daysToShow = 30 }) => {
  const { theme } = useTheme();

  const { chartData, balanceInsights } = useMemo(
    () => getCumulativeBalanceData(transactions, daysToShow),
    [transactions, daysToShow]
  );

  if (chartData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ThemedText>No balance data available</ThemedText>
      </View>
    );
  }

  const currentBalance = chartData[chartData.length - 1]?.runningBalance || 0;
  const startBalance = chartData[0]?.runningBalance || 0;
  const balanceChange = currentBalance - startBalance;
  const isPositiveChange = balanceChange >= 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerText}>
          Cumulative Balance Trend
        </ThemedText>
        <ThemedText style={styles.subHeaderText}>
          Running balance over the last {daysToShow} days
        </ThemedText>
      </View>

      <View style={styles.balanceHeader}>
        <View style={styles.balanceItem}>
          <ThemedText style={styles.balanceLabel}>Current Balance</ThemedText>
          <ThemedText
            style={[
              styles.balanceValue,
              { color: currentBalance >= 0 ? '#27ae60' : '#e74c3c' },
            ]}
          >
            {currentBalance >= 0 ? '+' : ''}
            {formatLargeNumber(currentBalance)}
          </ThemedText>
        </View>
        <View style={styles.balanceItem}>
          <ThemedText style={styles.balanceLabel}>Period Change</ThemedText>
          <ThemedText
            style={[
              styles.balanceValue,
              { color: isPositiveChange ? '#27ae60' : '#e74c3c' },
            ]}
          >
            {isPositiveChange ? '+' : ''}
            {formatLargeNumber(balanceChange)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          height={240}
          width={320}
          thickness={3}
          lineGradient={true}
          lineGradientStartColor="#27ae60"
          lineGradientEndColor="#f39c12"
          lineGradientDirection="vertical"
          hideDataPoints={chartData.length > 20}
          isAnimated
          animationDuration={1000}
          yAxisTextStyle={{ fontSize: 12, color: theme.textSecondary }}
          xAxisLabelTextStyle={{ fontSize: 10, color: theme.textSecondary }}
          formatYLabel={formatLargeNumber}
          rulesColor={theme.textSecondary}
          xAxisLabelsHeight={25}
          xAxisLabelsVerticalShift={5}
          renderTooltip={(item: any, index: number) => {
            const point = chartData[index];
            if (!point) return null;

            return (
              <View style={styles.tooltip}>
                <ThemedText style={styles.tooltipDate}>
                  {point.date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </ThemedText>
                <ThemedText style={styles.tooltipBalance}>
                  Balance: {formatLargeNumber(point.runningBalance)}
                </ThemedText>
                {point.transaction && (
                  <ThemedText
                    style={[
                      styles.tooltipTransaction,
                      {
                        color:
                          point.transaction.type === 'expense'
                            ? '#e74c3c'
                            : '#27ae60',
                      },
                    ]}
                  >
                    {point.transaction.type === 'expense' ? '-' : '+'}
                    {formatLargeNumber(point.transaction.amount)}
                  </ThemedText>
                )}
              </View>
            );
          }}
        />
      </View>

      <View style={styles.summary}>
        <ThemedText style={styles.summaryTitle}>
          Balance Trend Analysis
        </ThemedText>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryLabel}>Highest</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {formatLargeNumber(
                Math.max(...chartData.map((d) => d.runningBalance))
              )}
            </ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryLabel}>Lowest</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {formatLargeNumber(
                Math.min(...chartData.map((d) => d.runningBalance))
              )}
            </ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryLabel}>Volatility</ThemedText>
            <ThemedText style={styles.summaryValue}>
              {getVolatilityLevel(chartData)}
            </ThemedText>
          </View>
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryLabel}>Trend</ThemedText>
            <ThemedText
              style={[
                styles.summaryValue,
                { color: isPositiveChange ? '#27ae60' : '#e74c3c' },
              ]}
            >
              {isPositiveChange ? '📈 Up' : '📉 Down'}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.insights}>
        <ThemedText style={styles.insightsTitle}>Key Insights</ThemedText>
        {balanceInsights.map((insight, index) => (
          <ThemedText key={index} style={styles.insightText}>
            • {insight}
          </ThemedText>
        ))}
      </View>
    </View>
  );
};

const getCumulativeBalanceData = (
  transactions: Transaction[],
  daysToShow: number
): { chartData: BalancePoint[]; balanceInsights: string[] } => {
  // Sort transactions by date
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sortedTransactions.length === 0) {
    return { chartData: [], balanceInsights: ['No transactions available'] };
  }

  // Get the date range for the chart
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysToShow);

  // Filter transactions within the date range
  const recentTransactions = sortedTransactions.filter(
    (transaction) => new Date(transaction.date) >= startDate
  );

  // Calculate initial balance (from transactions before the period)
  const initialBalance = sortedTransactions
    .filter((transaction) => new Date(transaction.date) < startDate)
    .reduce((balance, transaction) => {
      return transaction.type === 'expense'
        ? balance - transaction.amount
        : balance + transaction.amount;
    }, 0);

  // Build cumulative balance points
  const balancePoints: BalancePoint[] = [];
  let runningBalance = initialBalance;

  // Add starting point
  balancePoints.push({
    value: runningBalance,
    date: new Date(startDate),
    label: startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    runningBalance,
  });

  // Process each transaction
  recentTransactions.forEach((transaction) => {
    const transactionAmount =
      transaction.type === 'expense' ? -transaction.amount : transaction.amount;

    runningBalance += transactionAmount;

    const date = new Date(transaction.date);
    balancePoints.push({
      value: runningBalance,
      date,
      label: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      runningBalance,
      transaction,
    });
  });

  // Add current date if not already included
  const lastPoint = balancePoints[balancePoints.length - 1];
  if (lastPoint && lastPoint.date.toDateString() !== endDate.toDateString()) {
    balancePoints.push({
      value: runningBalance,
      date: new Date(endDate),
      label: endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      runningBalance,
    });
  }

  // Optimize labels to show every 4th data point
  const optimizedPoints = balancePoints.map((point, index) => {
    // Show labels every 4 data points, plus first and last
    const shouldShowLabel =
      index === 0 || index === balancePoints.length - 1 || index % 4 === 0;

    return {
      ...point,
      label: shouldShowLabel ? point.label : '', // Hide label but keep data
    };
  });

  // Generate insights
  const insights = generateBalanceInsights(optimizedPoints, recentTransactions);

  return { chartData: optimizedPoints, balanceInsights: insights };
};

const generateBalanceInsights = (
  balancePoints: BalancePoint[],
  transactions: Transaction[]
): string[] => {
  if (balancePoints.length < 2) return ['Insufficient data for analysis'];

  const insights: string[] = [];
  const startBalance = balancePoints[0].runningBalance;
  const endBalance = balancePoints[balancePoints.length - 1].runningBalance;
  const totalChange = endBalance - startBalance;

  // Overall trend
  if (Math.abs(totalChange) < 10) {
    insights.push('Balance remained relatively stable over this period');
  } else if (totalChange > 0) {
    insights.push(
      `Balance improved by ${formatLargeNumber(totalChange)} during this period`
    );
  } else {
    insights.push(
      `Balance declined by ${formatLargeNumber(Math.abs(totalChange))} during this period`
    );
  }

  // Transaction activity
  const expenseCount = transactions.filter((t) => t.type === 'expense').length;
  const incomeCount = transactions.filter((t) => t.type === 'income').length;

  if (expenseCount > 0) {
    insights.push(
      `${expenseCount} expense transaction${expenseCount > 1 ? 's' : ''} recorded`
    );
  }
  if (incomeCount > 0) {
    insights.push(
      `${incomeCount} income transaction${incomeCount > 1 ? 's' : ''} recorded`
    );
  }

  // Balance extremes
  const balanceValues = balancePoints.map((p) => p.runningBalance);
  const maxBalance = Math.max(...balanceValues);
  const minBalance = Math.min(...balanceValues);

  if (maxBalance > endBalance) {
    insights.push(`Peak balance was ${formatLargeNumber(maxBalance)}`);
  }
  if (minBalance < endBalance && minBalance < 0) {
    insights.push(`Lowest point was ${formatLargeNumber(minBalance)}`);
  }

  // Spending behavior
  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  if (totalExpenses > totalIncome) {
    insights.push(
      `Expenses exceeded income by ${formatLargeNumber(totalExpenses - totalIncome)}`
    );
  } else if (totalIncome > totalExpenses) {
    insights.push(
      `Income exceeded expenses by ${formatLargeNumber(totalIncome - totalExpenses)}`
    );
  }

  return insights;
};

const getVolatilityLevel = (balancePoints: BalancePoint[]): string => {
  if (balancePoints.length < 3) return 'Unknown';

  const balances = balancePoints.map((p) => p.runningBalance);
  const changes = balances
    .slice(1)
    .map((balance, i) => Math.abs(balance - balances[i]));
  const avgChange =
    changes.reduce((sum, change) => sum + change, 0) / changes.length;

  if (avgChange < 50) return 'Low';
  if (avgChange < 200) return 'Medium';
  return 'High';
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
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  tooltip: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
    minWidth: 120,
  },
  tooltipDate: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  tooltipBalance: {
    color: 'white',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 2,
  },
  tooltipTransaction: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  summary: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  insights: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  insightText: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.8,
  },
});
