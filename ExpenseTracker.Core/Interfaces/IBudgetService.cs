using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Core.Interfaces;

public interface IBudgetService
{
    Task<Result<Budget>> SetBudget(int month, int year, decimal amount);
    Task<Result<Budget?>> GetBudget(int month, int year);
}