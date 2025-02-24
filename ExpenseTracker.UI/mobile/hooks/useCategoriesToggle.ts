import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { categoriesService } from '~/services/categories';

export const useCategoriesToggle = () => {
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

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
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    return {
        categoriesQuery,
        categories: categoriesQuery.data,
        selectedCategories,
        toggle,
        isLoading: categoriesQuery.isFetching,
        isError: categoriesQuery.isError
    };
};
