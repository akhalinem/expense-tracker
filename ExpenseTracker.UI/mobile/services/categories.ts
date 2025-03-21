import { ICategory, ICreateCategoryDto } from '~/types';
import { db } from './db';

const getCategories = async (): Promise<ICategory[]> => {
    if (!db) {
        throw new Error("Database not initialized");
    }

    const result = await db.getAllAsync<ICategory>('SELECT * FROM categories');

    return result;
}

const createCategory = async (category: ICreateCategoryDto): Promise<ICategory> => {
    if (!db) {
        throw new Error('Database not initialized');
    }

    const result = await db.runAsync(
        'INSERT INTO categories (name) VALUES (?)',
        [category.name]
    );

    if (result.changes !== 1) {
        throw new Error('Failed to create category');
    }

    const insertedCategory = await db.getFirstAsync<ICategory>('SELECT * FROM categories WHERE id = ?', [result.lastInsertRowId]);

    if (!insertedCategory) {
        throw new Error('Failed to retrieve created category');
    }

    return insertedCategory;
}

export const categoriesService = {
    getCategories,
    createCategory
};