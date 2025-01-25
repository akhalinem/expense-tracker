using ExpenseTracker.Cli.Models;

namespace ExpenseTracker.Cli.Interfaces;

public interface IBudgetService
{
    Result<Budget> SetBudget(int month, int year, decimal amount);
    Result<Budget?> GetBudget(int month, int year);
}