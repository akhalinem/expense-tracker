import { IBudget } from "~/types";
import { api } from "./api";

const getCurrentBudget = async (): Promise<IBudget> => {
    const response = await api.get<IBudget>('/budgets/current');

    if (!response || !response.data) {
        throw new Error("Failed to fetch current budget");
    }

    return response.data;
}

export const budgetsService = {
    getCurrentBudget
};