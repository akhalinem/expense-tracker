import { ICategory, ICreateCategoryDto } from '~/types';
import { categoriesTable } from '~/db/schema';
import { db } from './db';

const getCategories = async (): Promise<ICategory[]> => {
    if (!db) {
        throw new Error("Database not initialized");
    }

    const result = await db.query.categories.findMany();

    return result.map((category => ({
        id: category.id,
        name: category.name
    })));
}

const createCategory = async (category: ICreateCategoryDto): Promise<void> => {
    if (!db) {
        throw new Error('Database not initialized');
    }

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