import { IBudget, ICreateBudgetDto } from "~/types";
import { budgetsTable } from "~/db/schema";
import { db } from "./db";

const getMonthlyBudget = async (month: number, year: number): Promise<IBudget | null> => {
    if (!db) {
        throw new Error('Database not initialized');
    }

    const result = await db.query.budgets.findFirst({
        where: (budgets, { eq, and }) => and(eq(budgets.month, month), eq(budgets.year, year)),
    });

    if (!result) return null

    return {
        amount: result.amount,
        month: result.month,
        year: result.year
    };
}

const getHistory = async (): Promise<IBudget[]> => {
    if (!db) {
        throw new Error('Database not initialized');
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = now.getFullYear();

    const result = await db.query.budgets.findMany({
        where: (budgets, { eq, and, lt, or }) => or(lt(budgets.year, currentYear), and(eq(budgets.year, currentYear), lt(budgets.month, currentMonth))),
        orderBy: (budgets, { desc }) => [desc(budgets.year), desc(budgets.month)],
    });

    return result.map((budget) => ({
        amount: budget.amount,
        month: budget.month,
        year: budget.year
    }));
}

const getBudgets = async (): Promise<IBudget[]> => {
    if (!db) {
        throw new Error('Database not initialized');
    }

    const result = await db.query.budgets.findMany({
        orderBy: (budgets, { desc }) => [desc(budgets.year), desc(budgets.month)],
    });

    return result.map((budget) => ({
        amount: budget.amount,
        month: budget.month,
        year: budget.year
    }));
};

const createBudget = async (budget: ICreateBudgetDto): Promise<void> => {
    if (!db) {
        throw new Error('Database not initialized');
    }

    const result = await db.insert(budgetsTable).values({
        amount: budget.amount,
        month: budget.month,
        year: budget.year
    });

    if (result.changes === 0) {
        throw new Error('Failed to create budget');
    }
};

export const budgetsService = {
    getMonthlyBudget,
    getHistory,
    getBudgets,
    createBudget,
};