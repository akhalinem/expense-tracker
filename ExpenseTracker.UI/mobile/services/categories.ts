import { Category, CreateCategoryDto } from '~/types';
import { categoriesTable } from '~/db/schema';
import { db } from '~/services/db';

const getCategories = async (): Promise<Category[]> => {
    const result = await db.query.categories.findMany();

    return result.map((category => ({
        id: category.id,
        name: category.name
    })));
}

const createCategory = async (category: CreateCategoryDto): Promise<void> => {
    const result = await db.insert(categoriesTable).values({
        name: category.name
    });

    if (result.changes === 0) {
        throw new Error('Failed to create category');
    }
}

export const categoriesService = {
    getCategories,
    createCategory
};