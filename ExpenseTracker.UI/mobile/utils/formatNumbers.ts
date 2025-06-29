/**
 * Formats large numbers with K and M suffixes
 * @param value - The numeric value to format
 * @returns Formatted string with K/M suffix for large numbers
 */
export const formatLargeNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseInt(value) : value;

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }

  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }

  return num.toString();
};
