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

export const budgetsService = {
    getMonthlyBudget
};