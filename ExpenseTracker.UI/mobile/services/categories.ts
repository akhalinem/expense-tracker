import { ICategory } from "~/types";
import { db } from "./db";

const getCategories = async (): Promise<ICategory[]> => {
    if (!db) {
        throw new Error("Database not initialized");
    }

    const result = await db.getAllAsync<ICategory>('SELECT * FROM categories');

    return result;
}

export const categoriesService = {
    getCategories
};