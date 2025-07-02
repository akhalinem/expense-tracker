import React, { useMemo, useCallback } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Transaction } from '~/types';
import { useTheme } from '~/theme';
import { formatLargeNumber } from '~/utils/formatNumbers';
import ThemedText from '~/components/themed/ThemedText';
import {
  CHART_TYPOGRAPHY,
  CHART_SPACING,
  commonChartStyles,
  getChartColors,
} from './chartStyles';

// Constants to avoid recreating arrays
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
const LEGEND_INTENSITIES = [0, 0.2, 0.4, 0.6, 0.8, 1.0] as const;

export type ExpenseRecurrencePatternChartProps = {
  expenses: Transaction[];
  monthsToShow?: number;
};

type DayData = {
  date: Date;
  dayOfMonth: number;
  amount: number;
  transactionCount: number;
  intensity: number; // 0-1 for color intensity
  isToday: boolean;
  isCurrentMonth: boolean;
  backgroundColor: string; // Pre-computed color
  textColor: string; // Pre-computed text color
  opacity: number; // Pre-computed opacity
};

type WeekData = {
  days: DayData[];
  weekNumber: number;
};

type MonthData = {
  monthName: string;
  month: number;
  year: number;
  weeks: WeekData[];
  maxAmount: number;
};

export const ExpenseRecurrencePatternChart: React.FC<
  ExpenseRecurrencePatternChartProps
> = ({ expenses, monthsToShow = 3 }) => {
  const { theme } = useTheme();
  const chartColors = getChartColors(theme);

  // Pre-compute color cache to avoid recalculating
  const colorCache = useMemo(() => {
    const cache = new Map<string, string>();
    for (let i = 0; i <= 100; i++) {
      const intensity = i / 100;
      cache.set(
        `${intensity}_${chartColors.primary}`,
        getIntensityColor(intensity, chartColors.primary)
      );
    }
    return cache;
  }, [chartColors.primary]);

  const calendarData = useMemo(
    () => getCalendarData(expenses, monthsToShow, chartColors, colorCache),
    [expenses, monthsToShow, chartColors, colorCache]
  );

  const patternInsights = useMemo(
    () => getPatternInsights(calendarData),
    [calendarData]
  );

  // Memoized day cell component to avoid re-renders
  const DayCell = useCallback(
    ({ day }: { day: DayData }) => (
      <View
        style={[
          styles.dayCell,
          {
            backgroundColor: day.backgroundColor,
            borderColor: day.isToday ? chartColors.primary : 'transparent',
            borderWidth: day.isToday ? 2 : 1,
          },
        ]}
      >
        <ThemedText
          style={[
            styles.dayText,
            {
              color: day.textColor,
              opacity: day.opacity,
            },
          ]}
        >
          {day.dayOfMonth}
        </ThemedText>
      </View>
    ),
    [chartColors.primary]
  );

  if (calendarData.length === 0) {
    return (
      <View style={commonChartStyles.emptyContainer}>
        <ThemedText style={commonChartStyles.emptyText}>
          No spending pattern data available
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={commonChartStyles.chartTitle}>
          Expense Recurrence Pattern
        </ThemedText>
        <ThemedText style={commonChartStyles.chartSubtitle}>
          Calendar heatmap showing spending intensity by date
        </ThemedText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollContainer}
        removeClippedSubviews={true} // Performance optimization
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.calendarContainer}>
          {/* Day labels */}
          <View style={styles.dayLabelsContainer}>
            <View style={styles.monthLabelSpace} />
            {DAY_LABELS.map((day, index) => (
              <ThemedText key={index} style={styles.dayLabel}>
                {day}
              </ThemedText>
            ))}
          </View>

          {/* Calendar grid for each month */}
          {calendarData.map((monthData, monthIndex) => (
            <View
              key={`${monthData.year}-${monthData.month}`}
              style={styles.monthContainer}
            >
              <ThemedText style={styles.monthLabel}>
                {monthData.monthName}
              </ThemedText>

              <View style={styles.weeksContainer}>
                {monthData.weeks.map((week, weekIndex) => (
                  <View key={weekIndex} style={styles.weekRow}>
                    {week.days.map((day, dayIndex) => (
                      <DayCell key={`${day.date.getTime()}`} day={day} />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Intensity Legend */}
      <View style={styles.legendContainer}>
        <ThemedText style={styles.legendLabel}>Less</ThemedText>
        <View style={styles.intensityScale}>
          {LEGEND_INTENSITIES.map((intensity, index) => (
            <View
              key={index}
              style={[
                styles.intensityBox,
                {
                  backgroundColor:
                    colorCache.get(`${intensity}_${chartColors.primary}`) ||
                    'rgba(0,0,0,0.05)',
                },
              ]}
            />
          ))}
        </View>
        <ThemedText style={styles.legendLabel}>More</ThemedText>
      </View>

      {/* Pattern Insights */}
      <View style={commonChartStyles.insightsContainer}>
        <ThemedText style={commonChartStyles.insightsTitle}>
          Pattern Insights:
        </ThemedText>
        {patternInsights.map((insight, index) => (
          <ThemedText key={index} style={commonChartStyles.insightText}>
            • {insight}
          </ThemedText>
        ))}
      </View>
    </View>
  );
};

const getCalendarData = (
  expenses: Transaction[],
  monthsToShow: number,
  chartColors: any,
  colorCache: Map<string, string>
): MonthData[] => {
  const now = new Date();
  const monthsData: MonthData[] = [];

  // Safety check to prevent excessive computation
  if (monthsToShow > 12) {
    console.warn(
      'ExpenseRecurrencePatternChart: monthsToShow limited to 12 for performance'
    );
    monthsToShow = 12;
  }

  for (let i = monthsToShow - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = monthDate.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    });

    // Pre-filter expenses for this month to avoid repeated filtering
    const monthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getFullYear() === monthDate.getFullYear() &&
        expenseDate.getMonth() === monthDate.getMonth()
      );
    });

    // Calculate daily totals more efficiently
    const dailyTotals = new Map<number, { amount: number; count: number }>();
    let maxAmount = 1; // Avoid division by zero

    monthExpenses.forEach((expense) => {
      const day = new Date(expense.date).getDate();
      const current = dailyTotals.get(day);
      if (current) {
        current.amount += expense.amount;
        current.count += 1;
        maxAmount = Math.max(maxAmount, current.amount);
      } else {
        const newData = { amount: expense.amount, count: 1 };
        dailyTotals.set(day, newData);
        maxAmount = Math.max(maxAmount, expense.amount);
      }
    });

    // Build calendar grid with pre-computed colors
    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const lastDay = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0
    );
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    const weeks: WeekData[] = [];
    let currentWeek: DayData[] = [];
    let weekNumber = 0;

    // Calculate the end date properly to avoid infinite loop
    const endDate = new Date(lastDay);
    const daysToAdd = 6 - lastDay.getDay(); // Days needed to complete the last week
    endDate.setDate(endDate.getDate() + daysToAdd);

    // Safety counter to prevent infinite loops
    let iterationCount = 0;
    const maxIterations = 42; // 6 weeks * 7 days = maximum possible days in a month view

    for (
      let date = new Date(startDate);
      date <= endDate && iterationCount < maxIterations;
      date.setDate(date.getDate() + 1)
    ) {
      iterationCount++;

      const dayOfMonth = date.getDate();
      const isCurrentMonth = date.getMonth() === monthDate.getMonth();
      const dayData = dailyTotals.get(dayOfMonth);
      const isToday = date.toDateString() === now.toDateString();

      const amount = isCurrentMonth ? dayData?.amount || 0 : 0;
      const intensity = isCurrentMonth ? amount / maxAmount : 0;

      // Pre-compute colors to avoid runtime calculations
      const intensityKey = Math.round(intensity * 100) / 100;
      const backgroundColor = isCurrentMonth
        ? colorCache.get(`${intensityKey}_${chartColors.primary}`) ||
          'rgba(0,0,0,0.05)'
        : 'rgba(0,0,0,0.02)';

      const textColor = intensity > 0.5 ? 'white' : chartColors.text;
      const opacity = isCurrentMonth ? 1 : 0.3;

      const dayInfo: DayData = {
        date: new Date(date),
        dayOfMonth,
        amount,
        transactionCount: isCurrentMonth ? dayData?.count || 0 : 0,
        intensity,
        isToday,
        isCurrentMonth,
        backgroundColor,
        textColor,
        opacity,
      };

      currentWeek.push(dayInfo);

      if (currentWeek.length === 7) {
        weeks.push({ days: [...currentWeek], weekNumber });
        currentWeek = [];
        weekNumber++;
      }
    }

    // Handle any remaining days in the last incomplete week
    if (currentWeek.length > 0) {
      // Fill the rest of the week with empty days if needed
      while (currentWeek.length < 7) {
        const emptyDay: DayData = {
          date: new Date(),
          dayOfMonth: 0,
          amount: 0,
          transactionCount: 0,
          intensity: 0,
          isToday: false,
          isCurrentMonth: false,
          backgroundColor: 'rgba(0,0,0,0.02)',
          textColor: chartColors.text,
          opacity: 0.1,
        };
        currentWeek.push(emptyDay);
      }
      weeks.push({ days: [...currentWeek], weekNumber });
    }

    if (iterationCount >= maxIterations) {
      console.error(
        'ExpenseRecurrencePatternChart: Prevented infinite loop in calendar generation'
      );
    }

    monthsData.push({
      monthName,
      month: monthDate.getMonth(),
      year: monthDate.getFullYear(),
      weeks,
      maxAmount,
    });
  }

  return monthsData;
};

const getIntensityColor = (intensity: number, primaryColor: string): string => {
  if (intensity === 0) {
    return 'rgba(0,0,0,0.05)';
  }

  // Convert hex to rgb for blending - optimized
  const hex = primaryColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${0.2 + intensity * 0.8})`;
};

const getPatternInsights = (calendarData: MonthData[]): string[] => {
  const insights: string[] = [];

  // Analyze patterns across all months - optimized
  const allDays: DayData[] = [];
  calendarData.forEach((month) => {
    month.weeks.forEach((week) => {
      week.days.forEach((day) => {
        if (day.isCurrentMonth && day.amount > 0) {
          allDays.push(day);
        }
      });
    });
  });

  if (allDays.length === 0) return ['No spending data available for analysis'];

  // Find most expensive days of month - optimized
  const dayOfMonthTotals = new Map<number, number>();
  let totalAmount = 0;

  allDays.forEach((day) => {
    const current = dayOfMonthTotals.get(day.dayOfMonth) || 0;
    dayOfMonthTotals.set(day.dayOfMonth, current + day.amount);
    totalAmount += day.amount;
  });

  const topDays = Array.from(dayOfMonthTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (topDays.length > 0) {
    insights.push(
      `Most expensive dates: ${topDays.map(([day]) => `${day}th`).join(', ')}`
    );
  }

  // Find spending frequency
  const spendingDays = allDays.length;
  const totalDaysInPeriod = calendarData.reduce((total, month) => {
    return (
      total +
      month.weeks.reduce((monthTotal, week) => {
        return (
          monthTotal + week.days.filter((day) => day.isCurrentMonth).length
        );
      }, 0)
    );
  }, 0);

  const frequency = (spendingDays / totalDaysInPeriod) * 100;
  insights.push(`You spend money on ${frequency.toFixed(0)}% of days`);

  // Average spending intensity
  const avgAmount = totalAmount / spendingDays;
  insights.push(`Average daily spending: ${formatLargeNumber(avgAmount)}`);

  return insights;
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: CHART_SPACING.LG,
  },
  header: {
    alignItems: 'center',
    marginBottom: CHART_SPACING.LG,
  },
  scrollContainer: {
    marginHorizontal: CHART_SPACING.LG,
  },
  calendarContainer: {
    minWidth: 300,
  },
  dayLabelsContainer: {
    flexDirection: 'row',
    marginBottom: CHART_SPACING.SM,
  },
  monthLabelSpace: {
    width: 50,
  },
  dayLabel: {
    width: 30,
    textAlign: 'center',
    fontSize: CHART_TYPOGRAPHY.LABEL,
    fontWeight: CHART_TYPOGRAPHY.SUBTITLE_WEIGHT,
    opacity: CHART_TYPOGRAPHY.MUTED_OPACITY,
  },
  monthContainer: {
    marginBottom: CHART_SPACING.LG,
  },
  monthLabel: {
    fontSize: CHART_TYPOGRAPHY.SUBTITLE,
    fontWeight: CHART_TYPOGRAPHY.SUBTITLE_WEIGHT,
    marginBottom: CHART_SPACING.XS,
    width: 50,
  },
  weeksContainer: {
    flexDirection: 'column',
  },
  weekRow: {
    flexDirection: 'row',
    marginLeft: 50,
  },
  dayCell: {
    width: 28,
    height: 28,
    margin: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  dayText: {
    fontSize: CHART_TYPOGRAPHY.SMALL_LABEL,
    fontWeight: CHART_TYPOGRAPHY.SUBTITLE_WEIGHT,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: CHART_SPACING.LG,
    gap: CHART_SPACING.SM,
  },
  legendLabel: {
    fontSize: CHART_TYPOGRAPHY.LABEL,
    opacity: CHART_TYPOGRAPHY.MUTED_OPACITY,
  },
  intensityScale: {
    flexDirection: 'row',
    gap: 2,
  },
  intensityBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});
