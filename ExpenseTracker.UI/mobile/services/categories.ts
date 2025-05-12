import { count, desc, eq } from 'drizzle-orm';
import { Category, CategoryWithTransactionCount, CreateCategoryDto, UpdateCategoryDto } from '~/types';
import { DEFAULT_CATEGORY_COLOR } from '~/constants';
import { categoriesTable, transactionCategoriesTable, transactionsTable } from '~/db/schema';
import { db } from '~/services/db';

const getCategories = async (): Promise<Category[]> => {
    const result = await db.query.categories.findMany();

    return result;
}

const getCategoriesWithTransactionCount = async (): Promise<CategoryWithTransactionCount[]> => {
    const result = await db
        .select({
            id: categoriesTable.id,
            name: categoriesTable.name,
            color: categoriesTable.color,
            transactionCount: count(transactionCategoriesTable.id),
        })
        .from(categoriesTable)
        .leftJoin(
            transactionCategoriesTable,
            eq(categoriesTable.id, transactionCategoriesTable.categoryId)
        )
        .groupBy(categoriesTable.id, categoriesTable.name)
        .orderBy(({ transactionCount }) => desc(transactionCount))

    return result;
}

const createCategory = async (dto: CreateCategoryDto): Promise<void> => {
    const result = await db.insert(categoriesTable).values({
        name: dto.name,
        color: dto.color || DEFAULT_CATEGORY_COLOR
    });

    if (result.changes === 0) {
        throw new Error('Failed to create category');
    }
}

const updateCategory = async (dto: UpdateCategoryDto): Promise<void> => {
    const result = await db.update(categoriesTable)
        .set({ 
            name: dto.name,
            color: dto.color || DEFAULT_CATEGORY_COLOR
        })
        .where(eq(categoriesTable.id, dto.id));

    if (result.changes === 0) {
        throw new Error('Failed to update category');
    }
}

const getCategoryById = async (id: number): Promise<Category> => {
    const result = await db.query.categories.findFirst({
        where: eq(categoriesTable.id, id)
    });
    
    if (!result) {
        throw new Error('Category not found');
    }
    
    return result;
}

export const categoriesService = {
    getCategories,
    getCategoriesWithTransactionCount,
    createCategory,
    updateCategory,
    getCategoryById
};