import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Chart configuration constants
export const CHART_CONFIG = {
  // Responsive dimensions
  WIDTH: Math.min(screenWidth - 64, 320), // Max 320px, with 32px padding on each side
  HEIGHT: 240,
  COMPACT_HEIGHT: 200,

  // Chart specific settings
  BAR_WIDTH: 32,
  BAR_SPACING: 16,
  LINE_THICKNESS: 3,
  DATA_POINT_SIZE: 6,
  DATA_POINT_RADIUS: 3,

  // Pie chart settings
  PIE_RADIUS: 80,
  PIE_INNER_RADIUS: 45,
  PIE_STROKE_WIDTH: 2,

  // Animation
  ANIMATION_DURATION: 800,

  // Padding and margins
  CHART_PADDING: 20,
  VERTICAL_PADDING: 24,
} as const;

// Typography scale for charts
export const CHART_TYPOGRAPHY = {
  // Text sizes
  TITLE: 16,
  SUBTITLE: 14,
  LABEL: 12,
  SMALL_LABEL: 11,
  AXIS_LABEL: 11,
  LEGEND: 12,
  INSIGHT: 12,

  // Font weights
  TITLE_WEIGHT: '600' as const,
  SUBTITLE_WEIGHT: '500' as const,
  LABEL_WEIGHT: '400' as const,
  BOLD_WEIGHT: '600' as const,

  // Line heights
  TITLE_LINE_HEIGHT: 22,
  SUBTITLE_LINE_HEIGHT: 20,
  LABEL_LINE_HEIGHT: 16,

  // Opacity levels
  PRIMARY_OPACITY: 1,
  SECONDARY_OPACITY: 0.75,
  MUTED_OPACITY: 0.6,
  DISABLED_OPACITY: 0.4,
} as const;

// Spacing scale
export const CHART_SPACING = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 24,
  XXXL: 32,
} as const;

// Common chart styles
export const commonChartStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: CHART_SPACING.XL,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    minHeight: 120,
  },
  emptyText: {
    fontSize: CHART_TYPOGRAPHY.SUBTITLE,
    opacity: CHART_TYPOGRAPHY.SECONDARY_OPACITY,
    textAlign: 'center',
  },

  // Legend styles
  legend: {
    marginTop: CHART_SPACING.LG,
    gap: CHART_SPACING.MD,
    width: '100%',
  },
  legendHorizontal: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: CHART_SPACING.LG,
    flexWrap: 'wrap',
    gap: CHART_SPACING.MD,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CHART_SPACING.SM,
    maxWidth: 140,
  },
  legendItemHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 120,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: CHART_SPACING.SM,
  },
  legendColorSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: CHART_TYPOGRAPHY.LEGEND,
    fontWeight: CHART_TYPOGRAPHY.LABEL_WEIGHT,
    lineHeight: CHART_TYPOGRAPHY.LABEL_LINE_HEIGHT,
  },
  legendTextSecondary: {
    fontSize: CHART_TYPOGRAPHY.SMALL_LABEL,
    opacity: CHART_TYPOGRAPHY.MUTED_OPACITY,
    marginTop: 2,
  },

  // Insights container
  insightsContainer: {
    marginTop: CHART_SPACING.LG,
    width: '100%',
    paddingHorizontal: CHART_SPACING.SM,
  },
  insightsTitle: {
    fontSize: CHART_TYPOGRAPHY.SUBTITLE,
    fontWeight: CHART_TYPOGRAPHY.SUBTITLE_WEIGHT,
    textAlign: 'center',
    marginBottom: CHART_SPACING.SM,
    lineHeight: CHART_TYPOGRAPHY.SUBTITLE_LINE_HEIGHT,
  },
  insightText: {
    fontSize: CHART_TYPOGRAPHY.INSIGHT,
    textAlign: 'center',
    opacity: CHART_TYPOGRAPHY.SECONDARY_OPACITY,
    marginBottom: CHART_SPACING.XS,
    lineHeight: CHART_TYPOGRAPHY.LABEL_LINE_HEIGHT,
  },

  // Center info for pie charts
  centerInfo: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: CHART_CONFIG.CHART_PADDING + 40,
    left: 0,
    right: 0,
    bottom: 0,
  },
  centerLabel: {
    fontSize: CHART_TYPOGRAPHY.SMALL_LABEL,
    opacity: CHART_TYPOGRAPHY.MUTED_OPACITY,
    marginBottom: 2,
    textAlign: 'center',
  },
  centerValue: {
    fontSize: CHART_TYPOGRAPHY.TITLE,
    fontWeight: CHART_TYPOGRAPHY.TITLE_WEIGHT,
    lineHeight: CHART_TYPOGRAPHY.TITLE_LINE_HEIGHT,
    textAlign: 'center',
  },

  // Chart title styles
  chartTitle: {
    fontSize: CHART_TYPOGRAPHY.TITLE,
    fontWeight: CHART_TYPOGRAPHY.TITLE_WEIGHT,
    textAlign: 'center',
    marginBottom: CHART_SPACING.SM,
    lineHeight: CHART_TYPOGRAPHY.TITLE_LINE_HEIGHT,
  },
  chartSubtitle: {
    fontSize: CHART_TYPOGRAPHY.LABEL,
    opacity: CHART_TYPOGRAPHY.MUTED_OPACITY,
    textAlign: 'center',
    marginBottom: CHART_SPACING.LG,
    lineHeight: CHART_TYPOGRAPHY.LABEL_LINE_HEIGHT,
  },
});

// Chart color utilities
export const getChartColors = (theme: any) => ({
  primary: theme.primary,
  secondary: theme.secondary,
  text: theme.text,
  textSecondary: theme.textSecondary,
  surface: theme.surface,
  border: theme.border,

  // Chart specific colors
  axis: theme.textSecondary,
  grid: theme.border,
  focus: theme.primary,

  // Status colors
  success: theme.success,
  error: theme.error,

  // With opacity variations
  primaryLight: `${theme.primary}20`,
  primaryMedium: `${theme.primary}40`,
  primaryStrong: `${theme.primary}80`,
});

// Utility function for responsive chart width
export const getResponsiveChartWidth = (containerWidth?: number): number => {
  if (containerWidth) {
    return Math.min(containerWidth - CHART_SPACING.XXXL, CHART_CONFIG.WIDTH);
  }
  return CHART_CONFIG.WIDTH;
};

// Utility function for chart text styles based on theme
export const getChartTextStyle = (
  theme: any,
  variant: 'axis' | 'label' | 'focus' = 'axis'
) => {
  const baseStyle = {
    fontSize: CHART_TYPOGRAPHY.AXIS_LABEL,
    fontWeight: CHART_TYPOGRAPHY.LABEL_WEIGHT,
  };

  switch (variant) {
    case 'axis':
      return {
        ...baseStyle,
        color: theme.textSecondary,
      };
    case 'label':
      return {
        ...baseStyle,
        color: theme.text,
      };
    case 'focus':
      return {
        ...baseStyle,
        fontSize: CHART_TYPOGRAPHY.LABEL,
        fontWeight: CHART_TYPOGRAPHY.SUBTITLE_WEIGHT,
        color: theme.primary,
      };
    default:
      return baseStyle;
  }
};
