import { Category, Prisma } from "../generated/prisma";
import prisma from "../config/prisma";
import { ICategory, IValidationErrors } from "../types";

class CategoryService {
  /**
   * Get all categories for a user
   * @param userId - User ID from Supabase auth
   * @returns Array of categories
   */
  async getUserCategories(userId: string): Promise<Category[]> {
    try {
      const categories = await prisma.category.findMany({
        where: {
          user_id: userId,
        },
        orderBy: {
          updated_at: "desc",
        },
      });

      return categories;
    } catch (error) {
      console.error("Error fetching user categories:", error);
      throw new Error("Failed to fetch categories");
    }
  }

  /**
   * Get a specific category by ID
   * @param categoryId - Category ID
   * @param userId - User ID to ensure ownership
   * @returns Category or null if not found
   */
  async getCategory(
    categoryId: string,
    userId: string
  ): Promise<Category | null> {
    try {
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          user_id: userId,
        },
      });

      return category;
    } catch (error) {
      console.error("Error fetching category:", error);
      throw new Error("Failed to fetch category");
    }
  }

  /**
   * Create a new category
   * @param categoryData - Category data
   * @returns Created category
   */
  async createCategory(categoryData: ICategory): Promise<Category> {
    try {
      if (!categoryData.user_id || !categoryData.name) {
        throw new Error("User ID and category name are required");
      }

      const category = await prisma.category.create({
        data: {
          user_id: categoryData.user_id,
          name: categoryData.name,
          color: categoryData.color || "#000000",
        },
      });

      return category;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle unique constraint violations
        if (error.code === "P2002") {
          throw new Error("A category with this name already exists");
        }
      }

      console.error("Error creating category:", error);
      throw new Error("Failed to create category");
    }
  }

  /**
   * Update an existing category
   * @param categoryId - Category ID
   * @param userId - User ID to ensure ownership
   * @param updateData - Data to update
   * @returns Updated category
   */
  async updateCategory(
    categoryId: string,
    userId: string,
    updateData: Partial<ICategory>
  ): Promise<Category> {
    try {
      // First check if category exists and belongs to user
      const existingCategory = await this.getCategory(categoryId, userId);
      if (!existingCategory) {
        throw new Error("Category not found or access denied");
      }

      const category = await prisma.category.update({
        where: {
          id: categoryId,
        },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.color && { color: updateData.color }),
          updated_at: new Date(),
        },
      });

      return category;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new Error("A category with this name already exists");
        }
        if (error.code === "P2025") {
          throw new Error("Category not found");
        }
      }

      console.error("Error updating category:", error);
      throw new Error("Failed to update category");
    }
  }

  /**
   * Delete a category
   * @param categoryId - Category ID
   * @param userId - User ID to ensure ownership
   * @returns Success status
   */
  async deleteCategory(categoryId: string, userId: string): Promise<boolean> {
    try {
      // First check if category exists and belongs to user
      const existingCategory = await this.getCategory(categoryId, userId);
      if (!existingCategory) {
        throw new Error("Category not found or access denied");
      }

      // Note: This will cascade delete transaction_categories due to schema constraints
      await prisma.category.delete({
        where: {
          id: categoryId,
        },
      });

      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new Error("Category not found");
        }
      }

      console.error("Error deleting category:", error);
      throw new Error("Failed to delete category");
    }
  }

  /**
   * Bulk create categories for sync operations
   * @param categories - Array of categories to create
   * @param userId - User ID
   * @returns Created categories and error information
   */
  async bulkCreateCategories(
    categories: ICategory[],
    userId: string
  ): Promise<{
    created: Category[];
    errors: Array<{ category: ICategory; error: string }>;
  }> {
    const created: Category[] = [];
    const errors: Array<{ category: ICategory; error: string }> = [];

    for (const categoryData of categories) {
      try {
        const category = await this.createCategory({
          ...categoryData,
          user_id: userId,
        });
        created.push(category);
      } catch (error) {
        errors.push({
          category: categoryData,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { created, errors };
  }

  /**
   * Bulk update categories for sync operations
   * @param categories - Array of categories to update
   * @param userId - User ID
   * @returns Updated categories and error information
   */
  async bulkUpdateCategories(
    categories: ICategory[],
    userId: string
  ): Promise<{
    updated: Category[];
    errors: Array<{ category: ICategory; error: string }>;
  }> {
    const updated: Category[] = [];
    const errors: Array<{ category: ICategory; error: string }> = [];

    for (const categoryData of categories) {
      try {
        if (!categoryData.id) {
          throw new Error("Category ID is required for updates");
        }

        const category = await this.updateCategory(
          categoryData.id,
          userId,
          categoryData
        );
        updated.push(category);
      } catch (error) {
        errors.push({
          category: categoryData,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { updated, errors };
  }
}

export default new CategoryService();
