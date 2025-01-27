using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Core.Interfaces;

public interface IBudgetService
{
    Result<Budget> SetBudget(int month, int year, decimal amount);
    Result<Budget?> GetBudget(int month, int year);
}