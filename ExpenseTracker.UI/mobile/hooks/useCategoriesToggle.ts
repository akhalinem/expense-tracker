import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ICategory } from '~/types';
import { api } from '~/services/api';

export const useCategoriesToggle = () => {
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get<ICategory[]>('/categories');
            return response.data;
        },
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
        categories: categoriesQuery.data,
        selectedCategories,
        toggle,
        isLoading: categoriesQuery.isFetching,
        isError: categoriesQuery.isError
    };
};
