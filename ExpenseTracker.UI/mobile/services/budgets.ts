import { IBudget } from "~/types";
import { api } from "./api";

const getMonthlyBudget = async (month: number, year: number): Promise<IBudget | null> => {
    const response = await api.get<IBudget | null>('/budgets/monthly', {
        params: { month, year }
    });

    if (!response) {
        throw new Error('Failed to fetch monthly budget');
    }

    return response.data;
}

const getHistory = async (): Promise<IBudget[]> => {
    const response = await api.get<IBudget[]>('/budgets/history');

    if (!response) {
        throw new Error('Failed to fetch budget history');
    }

    return response.data;
}

const getBudgets = async (): Promise<IBudget[]> => {
    const response = await api.get<IBudget[]>('/budgets');

    if (!response || !response.data) {
        throw new Error("Failed to fetch budgets");
    }

    return response.data;
};

export const budgetsService = {
    getMonthlyBudget,
    getHistory,
    getBudgets,
};