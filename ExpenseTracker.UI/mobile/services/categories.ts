import { count, desc, eq } from 'drizzle-orm';
import { Category, CategoryWithTransactionCount, CreateCategoryDto } from '~/types';
import { categoriesTable, transactionsTable } from '~/db/schema';
import { db } from '~/services/db';

const getCategories = async (): Promise<Category[]> => {
    const result = await db.query.categories.findMany();

    return result.map((category => ({
        id: category.id,
        name: category.name,
    })));
}

const getCategoriesWithTransactionCount = async (): Promise<CategoryWithTransactionCount[]> => {
    const result = await db
        .select({
            id: categoriesTable.id,
            name: categoriesTable.name,
            transactionCount: count(transactionsTable.id),
        })
        .from(categoriesTable)
        .leftJoin(
            transactionsTable,
            eq(categoriesTable.id, transactionsTable.categoryId)
        )
        .groupBy(categoriesTable.id, categoriesTable.name)
        .orderBy(({ transactionCount }) => desc(transactionCount))

    return result;
}

const createCategory = async (category: CreateCategoryDto): Promise<void> => {
    const result = await db.insert(categoriesTable).values({
        name: category.name
    });

    if (result.changes === 0) {
        throw new Error('Failed to create category');
    }
}

const updateCategory = async (id: number, category: CreateCategoryDto): Promise<void> => {
    const result = await db.update(categoriesTable)
        .set({ name: category.name })
        .where(eq(categoriesTable.id, id));

    if (result.changes === 0) {
        throw new Error('Failed to update category');
    }
}

export const categoriesService = {
    getCategories,
    getCategoriesWithTransactionCount,
    createCategory,
    updateCategory
};