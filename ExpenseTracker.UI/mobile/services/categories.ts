import { ICategory } from "~/types";
import { api } from "./api";

const getCategories = async (): Promise<ICategory[]> => {
    const response = await api.get<ICategory[]>('/categories');

    if (!response || !response.data) {
        throw new Error("Failed to fetch categories");
    }

    return response.data;
}

export const categoriesService = {
    getCategories
};