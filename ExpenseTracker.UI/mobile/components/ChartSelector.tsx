import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTheme } from '~/theme';
import ThemedText from '~/components/themed/ThemedText';

export interface ChartOption {
  id: string;
  title: string;
  description: string;
  section: string;
}

interface ChartSelectorProps {
  chartOptions: ChartOption[];
  selectedCharts: string[];
  onSelectionChange: (selectedCharts: string[]) => void;
  onClose: () => void;
}

export const ChartSelector: React.FC<ChartSelectorProps> = ({
  chartOptions,
  selectedCharts,
  onSelectionChange,
  onClose,
}) => {
  const { theme } = useTheme();

  const toggleChart = (chartId: string) => {
    const newSelection = selectedCharts.includes(chartId)
      ? selectedCharts.filter((id) => id !== chartId)
      : [...selectedCharts, chartId];
    onSelectionChange(newSelection);
  };

  const selectAll = () => {
    onSelectionChange(chartOptions.map((chart) => chart.id));
  };

  const selectNone = () => {
    onSelectionChange([]);
  };

  const selectDefaults = () => {
    onSelectionChange(['monthly-category-breakdown', 'daily-category-stacked']);
  };

  // Group charts by section
  const chartsBySection = chartOptions.reduce(
    (acc, chart) => {
      if (!acc[chart.section]) {
        acc[chart.section] = [];
      }
      acc[chart.section].push(chart);
      return acc;
    },
    {} as Record<string, ChartOption[]>
  );

  return (
    <View style={styles.overlay}>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* iOS-style header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <ThemedText style={styles.title}>Charts</ThemedText>
          <Pressable style={styles.headerDoneButton} onPress={onClose}>
            <ThemedText
              style={[styles.headerDoneButtonText, { color: theme.primary }]}
            >
              Done
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Actions Section */}
          <View style={styles.iosSection}>
            <ThemedText
              style={[styles.iosSectionHeader, { color: theme.textSecondary }]}
            >
              QUICK ACTIONS
            </ThemedText>
            <View style={[styles.iosGroup, { backgroundColor: theme.surface }]}>
              <Pressable
                style={[styles.iosRow, { borderBottomColor: theme.border }]}
                onPress={selectDefaults}
              >
                <ThemedText style={styles.iosRowText}>Use Defaults</ThemedText>
                <ThemedText
                  style={[styles.iosRowDetail, { color: theme.textSecondary }]}
                >
                  2 charts
                </ThemedText>
              </Pressable>
              <Pressable
                style={[styles.iosRow, { borderBottomColor: theme.border }]}
                onPress={selectAll}
              >
                <ThemedText style={styles.iosRowText}>Select All</ThemedText>
                <ThemedText
                  style={[styles.iosRowDetail, { color: theme.textSecondary }]}
                >
                  {chartOptions.length} charts
                </ThemedText>
              </Pressable>
              <Pressable style={styles.iosRowLast} onPress={selectNone}>
                <ThemedText style={styles.iosRowText}>Clear All</ThemedText>
                <ThemedText
                  style={[styles.iosRowDetail, { color: theme.textSecondary }]}
                >
                  None
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Chart Sections */}
          {Object.entries(chartsBySection).map(([sectionName, charts]) => (
            <View key={sectionName} style={styles.iosSection}>
              <ThemedText
                style={[
                  styles.iosSectionHeader,
                  { color: theme.textSecondary },
                ]}
              >
                {sectionName.toUpperCase()}
              </ThemedText>
              <View
                style={[styles.iosGroup, { backgroundColor: theme.surface }]}
              >
                {charts.map((chart, index) => (
                  <Pressable
                    key={chart.id}
                    style={[
                      index === charts.length - 1
                        ? styles.iosRowLast
                        : styles.iosRow,
                      { borderBottomColor: theme.border },
                    ]}
                    onPress={() => toggleChart(chart.id)}
                  >
                    <View style={styles.chartContent}>
                      <View style={styles.chartText}>
                        <ThemedText style={styles.chartTitle}>
                          {chart.title}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.chartDescription,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {chart.description}
                        </ThemedText>
                      </View>
                      <View style={styles.switchContainer}>
                        <View
                          style={[
                            styles.toggle,
                            {
                              backgroundColor: selectedCharts.includes(chart.id)
                                ? theme.primary
                                : theme.textSecondary + '40',
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.toggleKnob,
                              {
                                backgroundColor: '#ffffff',
                                transform: [
                                  {
                                    translateX: selectedCharts.includes(
                                      chart.id
                                    )
                                      ? 16
                                      : 0,
                                  },
                                ],
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          {/* Footer info */}
          <View style={styles.footer}>
            <ThemedText
              style={[styles.footerText, { color: theme.textSecondary }]}
            >
              {selectedCharts.length} of {chartOptions.length} charts selected
            </ThemedText>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

// Default export for compatibility
export default ChartSelector;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    height: '90%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  // iOS-style header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  headerDoneButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  headerDoneButtonText: {
    fontSize: 17,
    fontWeight: '500',
  },
  // iOS-style content
  scrollView: {
    flex: 1,
  },
  iosSection: {
    marginTop: 20,
  },
  iosSectionHeader: {
    fontSize: 13,
    fontWeight: '400',
    paddingHorizontal: 16,
    paddingBottom: 8,
    letterSpacing: 0.5,
  },
  iosGroup: {
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  iosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  iosRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iosRowText: {
    fontSize: 17,
    fontWeight: '400',
  },
  iosRowDetail: {
    fontSize: 17,
    fontWeight: '400',
  },
  // Chart item styles
  chartContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  chartText: {
    flex: 1,
    paddingRight: 12,
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: '400',
    marginBottom: 2,
  },
  chartDescription: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  // iOS-style toggle switch
  switchContainer: {
    flexShrink: 0,
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 16,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleKnob: {
    width: 27,
    height: 27,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  // Footer
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '400',
  },
});
