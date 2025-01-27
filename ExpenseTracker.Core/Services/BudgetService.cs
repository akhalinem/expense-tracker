using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Core.Services;

public class BudgetService : IBudgetService
{
    private readonly IStorageService<Budget> _storage;
    private readonly List<Budget> _budgets;

    public BudgetService(IStorageService<Budget> storage)
    {
        _storage = storage;
        var result = _storage.Load();
        _budgets = result.IsSuccess ? result.Value!.ToList() : [];
    }

    public Result<Budget> SetBudget(int month, int year, decimal amount)
    {
        var budget = _budgets.FirstOrDefault(b => b.Month == month && b.Year == year);

        if (budget != null)
        {
            budget.Amount = amount;
        }
        else
        {
            budget = new Budget { Month = month, Year = year, Amount = amount };
            _budgets.Add(budget);
        }

        var result = _storage.Save(_budgets);
        return result.IsSuccess
            ? Result<Budget>.Success(budget)
            : Result<Budget>.Failure(result.Error!);
    }

    public Result<Budget?> GetBudget(int month, int year)
    {
        var budget = _budgets.FirstOrDefault(b => b.Month == month && b.Year == year);
        return Result<Budget?>.Success(budget);
    }
}