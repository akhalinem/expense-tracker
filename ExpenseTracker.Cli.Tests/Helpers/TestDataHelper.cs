using ExpenseTracker.Cli.Models;

namespace ExpenseTracker.Cli.Tests.Helpers;

public static class TestDataHelper
{
    public static Expense CreateExpense(
        string name = "Test Expense",
        decimal amount = 100m,
        string? category = null,
        DateTime? createdAt = null) =>
        new()
        {
            Id = Guid.NewGuid(),
            Name = name,
            Amount = amount,
            Category = category,
            CreatedAt = createdAt ?? DateTime.Now
        };

    public static Budget CreateBudget(
        int month = 1,
        int year = 2024,
        decimal amount = 1000m) =>
        new()
        {
            Month = month,
            Year = year,
            Amount = amount
        };
}