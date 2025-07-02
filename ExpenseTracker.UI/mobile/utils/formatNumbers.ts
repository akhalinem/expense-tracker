/**
 * Formats large numbers with K and M suffixes
 * @param value - The numeric value to format
 * @returns Formatted string with K/M suffix for large numbers
 */
export const formatLargeNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;

  // Handle invalid numbers
  if (isNaN(num)) return '0';

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1_000_000) {
    return `${sign}${(absNum / 1_000_000).toFixed(1)}M`;
  }

  if (absNum >= 1_000) {
    return `${sign}${(absNum / 1_000).toFixed(1)}K`;
  }

  return num.toString();
};
