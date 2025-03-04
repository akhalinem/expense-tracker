import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ICategory } from '~/types';
import { categoriesService } from '~/services/categories';

export type UseCategoriesToggleProps = {
    multiple?: boolean;
    defaultSelected?: string[];
    onChanged?: (selectedCategories: string[]) => void;
};

export type UserCategoriesToggleReturn = {
    multiple: boolean;
    categories: ICategory[];
    selected: Set<string>;
    toggle: (categoryId: string) => void;
    refetch: () => void;
    isLoading: boolean;
    isError: boolean;
}

export const useCategoriesToggle = ({ multiple = false, defaultSelected, onChanged }: UseCategoriesToggleProps = {}): UserCategoriesToggleReturn => {
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
        () => new Set(defaultSelected ?? [])
    );

    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: categoriesService.getCategories,
        placeholderData: keepPreviousData
    });

    const toggle = (categoryId: string) => {
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
