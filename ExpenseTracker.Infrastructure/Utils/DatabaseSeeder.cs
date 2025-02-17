using System.Text.Json;
using ExpenseTracker.Core.Models;
using ExpenseTracker.Infrastructure.Data;

namespace ExpenseTracker.Infrastructure.Utils;

public static class DatabaseSeeder
{
    public static async Task SeedDatabase(ExpenseTrackerDbContext context, string seedDataDir)
    {
        await context.Database.EnsureCreatedAsync();

        var jsonSerializerOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        // Seed categories first
        if (!context.Categories.Any())
        {
            var categoriesJson = await File.ReadAllTextAsync(Path.Combine(seedDataDir, "categories_seed.json"));
            var categories = JsonSerializer.Deserialize<List<Category>>(categoriesJson, jsonSerializerOptions);
            await context.Categories.AddRangeAsync(categories!);
            await context.SaveChangesAsync();
        }

        // Seed expenses
        if (!context.Expenses.Any())
        {
            var expensesJson = await File.ReadAllTextAsync(Path.Combine(seedDataDir, "expenses_seed.json"));
            var expenses = JsonSerializer.Deserialize<List<Expense>>(expensesJson, jsonSerializerOptions);
            await context.Expenses.AddRangeAsync(expenses!);
            await context.SaveChangesAsync();
        }

        // Seed budgets
        if (!context.Budgets.Any())
        {
            var budgetsJson = await File.ReadAllTextAsync(Path.Combine(seedDataDir, "budgets_seed.json"));
            var budgets = JsonSerializer.Deserialize<List<Budget>>(budgetsJson, jsonSerializerOptions);
            await context.Budgets.AddRangeAsync(budgets!);
            await context.SaveChangesAsync();
        }
    }
}
