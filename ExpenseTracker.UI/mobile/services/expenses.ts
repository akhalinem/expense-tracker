import { ICreateExpenseDto, IExpense, IExpenseEntity, IUpdateExpenseDto } from "~/types";
import { mapExpenseEntityToExpense } from "~/utils";
import { db } from "./db";

const getExpenses = async (categoryIds?: string[], month?: number, year?: number): Promise<IExpense[]> => {
    if (!db) {
        throw new Error("Database not initialized");
    }

    const categoryIdsString = categoryIds?.length ? categoryIds.join(',') : null;
    const monthString = month ? month.toString().padStart(2, '0') : null;
    const yearString = year ? year.toString() : null;

    let query = `
        SELECT 
            e.id, 
            e.amount, 
            e.description,
            e.date, 
            c.id as categoryId,
            c.name as categoryName
        FROM expenses e 
        LEFT JOIN categories c ON e.categoryId = c.id
        WHERE 1 = 1
        `;

    const params: Record<string, any> = {};

    if (categoryIdsString) {
        query += " AND e.categoryId IN ($categories)";
        params.$categories = categoryIdsString;
    }

    if (monthString) {
        query += " AND strftime('%m', e.date) = $month";
        params.$month = monthString;
    }

    if (yearString) {
        query += " AND strftime('%Y', e.date) = $year";
        params.$year = yearString;
    }

    query += " ORDER BY e.date DESC";

    const expenses = await db.getAllAsync<IExpenseEntity>(query, params);

    return expenses.map(mapExpenseEntityToExpense);
}

const deleteExpense = async (id: number): Promise<void> => {
    if (!db) {
        throw new Error("Database not initialized");
    }

    try {
        await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
    } catch (e) {
        throw new Error("Failed to delete expense", { cause: e });
    }
};

const createExpense = async (dto: ICreateExpenseDto): Promise<IExpense> => {
    if (!db) {
        throw new Error("Database not initialized");
    }

    const result = await db.runAsync(`
        INSERT INTO expenses (categoryId, amount, date, description)
        VALUES ($categoryId, $amount, DATETIME('now'), $description)
    `, {
        $categoryId: dto.categoryId,
        $amount: dto.amount,
        $description: dto.description
    });

    if (!result.lastInsertRowId) {
        throw new Error("Failed to create expense");
    }

    const insertedRecord = await db.getFirstAsync<IExpenseEntity>(`
        SELECT 
            e.id,
            e.amount, 
            e.description, 
            e.date, 
            c.id as categoryId, 
            c.name as categoryName
        FROM expenses e
        LEFT JOIN categories c ON e.categoryId = c.id 
        WHERE e.id = ?
        `, [result.lastInsertRowId]);

    if (!insertedRecord) {
        throw new Error("Failed to fetch created expense");
    }

    return mapExpenseEntityToExpense(insertedRecord);
};

const updateExpense = async (dto: IUpdateExpenseDto): Promise<IExpense> => {
    if (!db) {
        throw new Error("Database not initialized");
    }

    const result = await db.runAsync(`
        UPDATE expenses
        SET categoryId = $categoryId, amount = $amount, description = $description
        WHERE id = $id
    `, {
        $id: dto.id,
        $categoryId: dto.categoryId,
        $amount: dto.amount,
        $description: dto.description
    });

    if (result.changes === 0) {
        throw new Error("Failed to update expense");
    }

    const updatedRecord = await db.getFirstAsync<IExpenseEntity>(`
        SELECT 
            e.id,
            e.amount, 
            e.description, 
            e.date as createdAt, 
            c.id as categoryId, 
            c.name as categoryName,
            NULL as updatedAt
        FROM expenses e
        LEFT JOIN categories c ON e.categoryId = c.id 
        WHERE e.id = ?
    `, [dto.id]);

    if (!updatedRecord) {
        throw new Error("Failed to fetch updated expense");
    }

    return mapExpenseEntityToExpense(updatedRecord);
};

export const expensesService = {
    getExpenses,
    deleteExpense,
    createExpense,
    updateExpense
};