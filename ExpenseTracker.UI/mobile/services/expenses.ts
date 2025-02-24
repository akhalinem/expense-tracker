import { ICreateExpenseDto, IExpense, IUpdateExpenseDto } from "~/types";
import { api } from "./api";

const getExpenses = async (categoryIds: string[]): Promise<IExpense[]> => {
    const response = await api.get<IExpense[]>('/expenses', {
        params: {
            categoryIds: categoryIds.join()
        }
    });

    if (!response || !response.data) {
        throw new Error("Failed to fetch expenses");
    }

    return response.data;
}

const deleteExpense = async (id: number): Promise<void> => {
    const response = await api.delete(`/expenses/${id}`);

    if (!response) {
        throw new Error("Failed to delete expense");
    }
};

const createExpense = async (dto: ICreateExpenseDto): Promise<IExpense> => {
    const response = await api.post<IExpense>('/expenses', dto);

    if (!response || !response.data) {
        throw new Error("Failed to create expense");
    }

    return response.data;
};

const updateExpense = async (dto: IUpdateExpenseDto): Promise<IExpense> => {
    const response = await api.put<IExpense>(`/expenses/${dto.id}`, dto);

    if (!response || !response.data) {
        throw new Error("Failed to update expense");
    }

    return response.data;
};

export const expensesService = {
    getExpenses,
    deleteExpense,
    createExpense,
    updateExpense
};