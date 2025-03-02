import { IBudget } from "~/types";
import { api } from "./api";

const getCurrentBudget = async (): Promise<IBudget | null> => {
    const response = await api.get<IBudget | null>('/budgets/current');

    if (!response) {
        throw new Error("Failed to fetch current budget");
    }

    return response.data;
}

export const budgetsService = {
    getCurrentBudget
};