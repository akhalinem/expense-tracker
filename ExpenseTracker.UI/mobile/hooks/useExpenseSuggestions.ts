import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { transactionsService } from '~/services/transactions';

export function useExpenseSuggestions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch all transactions once
  const { data: allTransactions, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsService.getTransactions,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!searchTerm, // Only fetch when we have a search term
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Debounce search updates
  const debouncedSetSearchTerm = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
      setShowSuggestions(!!term);
    }, 300),
    []
  );

  // Generate suggestions based on search term
  const suggestions = useMemo(() => {
    if (!searchTerm || !allTransactions) return [];

    const term = searchTerm.trim().toLowerCase();
    return allTransactions
      .map((tx) => {
        // Calculate match score
        let score = 0;
        const description = (tx.description || '').toLowerCase();

        // Exact matches score higher
        if (description === term) score += 10;

        // Partial matches
        if (description.includes(term)) score += 5;

        // Recency boost (0-3 points)
        const daysSinceTransaction = Math.floor(
          (Date.now() - new Date(tx.date).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceTransaction < 30) {
          score += 3 - daysSinceTransaction / 10;
        }

        // Frequency boost - more categories means more common expense
        if (tx.categories) {
          score += Math.min(tx.categories.length, 2);
        }

        return { transaction: tx, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.transaction);
  }, [searchTerm, allTransactions]);

  return {
    suggestions,
    isSearching: isLoading,
    showSuggestions,
    setShowSuggestions,
    updateSearchTerm: debouncedSetSearchTerm,
  };
}
