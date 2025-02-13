import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ICategory } from '../types';
import { api } from '../services/api';

export const useCategories = () => {
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get<ICategory[]>('/categories');
            return response.data;
        },
        placeholderData: keepPreviousData
    });

    const toggleCategory = (categoryId: string) => {
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
        toggleCategory,
        isLoading: categoriesQuery.isFetching,
        isError: categoriesQuery.isError
    };
};
