using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ExpenseTracker.Core.Models;
using ExpenseTracker.Infrastructure.Data;

namespace ExpenseTracker.Infrastructure.Utils;

public static class DatabaseBackup
{
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        WriteIndented = true
    };

    private class ExpenseBackupDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public decimal Amount { get; set; }
        public Guid? CategoryId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public static ExpenseBackupDto FromExpense(Expense expense) => new()
        {
            Id = expense.Id,
            Name = expense.Name,
            Amount = expense.Amount,
            CategoryId = expense.CategoryId,
            CreatedAt = expense.CreatedAt,
            UpdatedAt = expense.UpdatedAt
        };
    }

    private class CategoryBackupDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;

        public static CategoryBackupDto FromCategory(Category category) => new()
        {
            Id = category.Id,
            Name = category.Name
        };
    }

    public static async Task CreateBackup(ExpenseTrackerDbContext context, string backupDir)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();
        try
        {
            Directory.CreateDirectory(backupDir);
            var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
            var backupPath = Path.Combine(backupDir, timestamp);
            Directory.CreateDirectory(backupPath);

            // Backup expenses
            var expenses = await context.Expenses
                .AsNoTracking()
                .ToListAsync();
            var expenseDtos = expenses.Select(ExpenseBackupDto.FromExpense);
            await File.WriteAllTextAsync(
                Path.Combine(backupPath, "expenses_backup.json"),
                JsonSerializer.Serialize(expenseDtos, _jsonOptions)
            );

            // Backup categories
            var categories = await context.Categories
                .AsNoTracking()
                .ToListAsync();
            var categoryDtos = categories.Select(CategoryBackupDto.FromCategory);
            await File.WriteAllTextAsync(
                Path.Combine(backupPath, "categories_backup.json"),
                JsonSerializer.Serialize(categoryDtos, _jsonOptions)
            );

            // Backup budgets
            var budgets = await context.Budgets
                .AsNoTracking()
                .ToListAsync();
            await File.WriteAllTextAsync(
                Path.Combine(backupPath, "budgets_backup.json"),
                JsonSerializer.Serialize(budgets, _jsonOptions)
            );

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public static async Task ResetDatabase(ExpenseTrackerDbContext context)
    {
        await context.Database.EnsureDeletedAsync();
        await context.Database.MigrateAsync();
    }

    public static async Task RestoreFromBackup(ExpenseTrackerDbContext context, string backupPath)
    {
        // First ensure database is completely cleaned and recreated with proper schema
        await context.Database.EnsureDeletedAsync();
        await context.Database.MigrateAsync();

        await using var transaction = await context.Database.BeginTransactionAsync();
        try
        {
            // Restore categories first due to foreign key constraints
            var categoriesJson = await File.ReadAllTextAsync(Path.Combine(backupPath, "categories_backup.json"));
            var categories = JsonSerializer.Deserialize<List<CategoryBackupDto>>(categoriesJson, _jsonOptions)!
                .Select(dto => new Category
                {
                    Id = dto.Id,
                    Name = dto.Name
                });
            await context.Categories.AddRangeAsync(categories);
            await context.SaveChangesAsync();

            // Restore expenses
            var expensesJson = await File.ReadAllTextAsync(Path.Combine(backupPath, "expenses_backup.json"));
            var expenses = JsonSerializer.Deserialize<List<ExpenseBackupDto>>(expensesJson, _jsonOptions)!
                .Select(dto => new Expense
                {
                    Id = dto.Id,
                    Name = dto.Name,
                    Amount = dto.Amount,
                    CategoryId = dto.CategoryId,
                    CreatedAt = dto.CreatedAt,
                    UpdatedAt = dto.UpdatedAt
                });
            await context.Expenses.AddRangeAsync(expenses);
            await context.SaveChangesAsync();

            // Restore budgets
            var budgetsJson = await File.ReadAllTextAsync(Path.Combine(backupPath, "budgets_backup.json"));
            var budgets = JsonSerializer.Deserialize<List<Budget>>(budgetsJson, _jsonOptions)!;
            await context.Budgets.AddRangeAsync(budgets);
            await context.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
