import { IBudget } from "~/types";
import { db } from "./db";

const getMonthlyBudget = async (month: number, year: number): Promise<IBudget | null> => {
    if (!db) {
        throw new Error('Database not initialized');
    }

    const result = await db.getFirstAsync<IBudget>('SELECT * FROM budgets WHERE month = ? AND year = ?', [month, year]);

    return result;
}

const getHistory = async (): Promise<IBudget[]> => {
    if (!db) {
        throw new Error('Database not initialized');
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = now.getFullYear();

    const result = await db.getAllAsync<IBudget>(
        `SELECT * FROM budgets 
         WHERE year < ? OR (year = ? AND month < ?) 
         ORDER BY year DESC, month DESC`,
        [currentYear, currentYear, currentMonth]
    );

    return result;
}

const getBudgets = async (): Promise<IBudget[]> => {
    if (!db) {
        throw new Error('Database not initialized');
    }

    const result = await db.getAllAsync<IBudget>('SELECT * FROM budgets');

    return result;
};

export const budgetsService = {
    getMonthlyBudget,
    getHistory,
    getBudgets,
};