import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CategoryWithTransactionCount } from '~/types';
import { categoriesService } from '~/services/categories';

export type UseCategoriesToggleProps = {
    multiple?: boolean;
    defaultSelected?: number[];
    onChanged?: (selectedCategories: number[]) => void;
};

export type UserCategoriesToggleReturn = {
    multiple: boolean;
    categories: CategoryWithTransactionCount[];
    selected: Set<number>;
    toggle: (categoryId: number) => void;
    setCategories: (ids: number[]) => void;
    refetch: () => void;
    isLoading: boolean;
    isError: boolean;
}

export const useCategoriesToggle = ({ multiple = false, defaultSelected, onChanged }: UseCategoriesToggleProps = {}): UserCategoriesToggleReturn => {
    const [selectedCategories, setSelectedCategories] = useState<Set<number>>(
        () => new Set(defaultSelected ?? [])
    );

    const categoriesWithTransactionsCountQuery = useQuery({
        queryKey: ['categoriesWithTransactionsCount'],
        queryFn: categoriesService.getCategoriesWithTransactionCount,
        placeholderData: keepPreviousData,
        select: (data) => [...data].sort((a, b) => b.transactionCount - a.transactionCount)
    });

    const toggle = (categoryId: number) => {
        setSelectedCategories(prev => {
            const newSet = new Set(prev);

            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                if (!multiple) newSet.clear();
                newSet.add(categoryId);
            }

            return newSet;
        });
    };

    const setCategories = (ids: number[]) => {
        setSelectedCategories(new Set(ids));
    };

    useEffect(() => {
        onChanged?.(Array.from(selectedCategories));
    }, [selectedCategories]);

    return {
        multiple,
        categories: categoriesWithTransactionsCountQuery.data ?? [],
        selected: selectedCategories,
        toggle,
        setCategories,
        refetch: categoriesWithTransactionsCountQuery.refetch,
        isLoading: categoriesWithTransactionsCountQuery.isFetching,
        isError: categoriesWithTransactionsCountQuery.isError
    };
};
