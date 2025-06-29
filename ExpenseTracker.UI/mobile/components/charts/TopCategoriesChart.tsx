import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import ThemedText from '../themed/ThemedText';

export type TopCategoryChartItem = {
  category: string;
  amount: number;
  color: string;
};

export type TopCategoriesChartProps = {
  data: TopCategoryChartItem[];
};

export const TopCategoriesChart: React.FC<TopCategoriesChartProps> = ({
  data,
}) => {
  // Calculate total amount for percentage calculation
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <PieChart
        data={data.map((item) => ({
          value: item.amount,
          color: item.color,
        }))}
        paddingVertical={24}
        paddingHorizontal={24}
      />

      <View style={styles.legend}>
        {data.map((item, index) => {
          const percentage =
            totalAmount > 0
              ? ((item.amount / totalAmount) * 100).toFixed(1)
              : '0.0';
          return (
            <View key={index} style={styles.legendItem}>
              <View
                style={[styles.colorBox, { backgroundColor: item.color }]}
              />
              <ThemedText>
                {item.category} ({percentage}%)
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  legend: {
    marginTop: 12,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorBox: {
    width: 12,
    height: 12,
    marginRight: 4,
    borderRadius: '50%',
  },
});
