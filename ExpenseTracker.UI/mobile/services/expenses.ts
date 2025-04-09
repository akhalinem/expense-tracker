import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { ICreateExpenseDto, IExpense, IUpdateExpenseDto } from "~/types";
import { categoriesTable, expensesTable } from "~/db/schema";
import { db } from "./db";

const getExpenses = async (categoryIds?: number[], month?: number, year?: number): Promise<IExpense[]> => {
    if (!db) {
        throw new Error("Database not initialized");
    }

    let query = db.select()
        .from(expensesTable)
        .leftJoin(categoriesTable, eq(categoriesTable.id, expensesTable.categoryId));

    const conditions = [];

    if (categoryIds?.length) {
        conditions.push(inArray(expensesTable.categoryId, categoryIds));
    }

    if (month && year) {
        conditions.push(
            and(
                eq(sql`strftime('%m', ${expensesTable.date})`, month.toString().padStart(2, '0')),
                eq(sql`strftime('%Y', ${expensesTable.date})`, year.toString())
            )
        );
    }

    const result = await query
        .where(and(...conditions))
        .orderBy(desc(expensesTable.date));

    return result
        .filter(({ categories: c }) => c)
        .map(({ expenses: e, categories: c }) => ({
            id: e.id,
            categoryId: c?.id as number,
            categoryName: c?.name as string,
            amount: e.amount,
            description: e.description ?? '',
            date: e.date
        }));
}

const deleteExpense = async (id: number): Promise<void> => {
    if (!db) {
        throw new Error("Database not initialized");
    }

    const result = await db.delete(expensesTable).where(eq(expensesTable.id, id));

    if (result.changes === 0) {
        throw new Error("Failed to delete expense");
    }
};

const createExpense = async (dto: ICreateExpenseDto): Promise<void> => {
    if (!db) {
        throw new Error("Database not initialized");
    }

    const result = await db
        .insert(expensesTable)
        .values({
            categoryId: dto.categoryId,
            amount: dto.amount,
            date: dto.date,
            description: dto.description
        });

    if (result.changes === 0) {
        throw new Error("Failed to create expense");
    }
};

const updateExpense = async (dto: IUpdateExpenseDto): Promise<void> => {
    if (!db) {
        throw new Error("Database not initialized");
    }

    const result = await db
        .update(expensesTable)
        .set({
            categoryId: dto.categoryId,
            amount: dto.amount,
            description: dto.description
        })
        .where(eq(expensesTable.id, dto.id));

    if (result.changes === 0) {
        throw new Error("Failed to update expense");
    }
};

export const expensesService = {
    getExpenses,
    deleteExpense,
    createExpense,
    updateExpense
};