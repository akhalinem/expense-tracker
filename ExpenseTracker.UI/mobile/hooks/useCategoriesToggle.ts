import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Category } from '~/types';
import { categoriesService } from '~/services/categories';

export type UseCategoriesToggleProps = {
    multiple?: boolean;
    defaultSelected?: number[];
    onChanged?: (selectedCategories: number[]) => void;
};

export type UserCategoriesToggleReturn = {
    multiple: boolean;
    categories: Category[];
    selected: Set<number>;
    toggle: (categoryId: number) => void;
    refetch: () => void;
    isLoading: boolean;
    isError: boolean;
}

export const useCategoriesToggle = ({ multiple = false, defaultSelected, onChanged }: UseCategoriesToggleProps = {}): UserCategoriesToggleReturn => {
    const [selectedCategories, setSelectedCategories] = useState<Set<number>>(
        () => new Set(defaultSelected ?? [])
    );

    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: categoriesService.getCategories,
        placeholderData: keepPreviousData
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

    useEffect(() => {
        onChanged?.(Array.from(selectedCategories));
    }, [selectedCategories]);

    return {
        multiple,
        categories: categoriesQuery.data ?? [],
        selected: selectedCategories,
        toggle,
        refetch: categoriesQuery.refetch,
        isLoading: categoriesQuery.isFetching,
        isError: categoriesQuery.isError
    };
};
