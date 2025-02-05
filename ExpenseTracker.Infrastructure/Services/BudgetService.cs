using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Infrastructure.Services;

public class BudgetService : IBudgetService
{
    private readonly IBudgetRepository _repository;

    public BudgetService(IBudgetRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<Budget>> SetBudget(int month, int year, decimal amount)
    {
        if (amount <= 0)
            return Result<Budget>.Failure("Budget amount must be greater than zero");

        return await _repository.SetAsync(month, year, amount);
    }

    public async Task<Result<Budget?>> GetBudget(int month, int year)
    {
        return await _repository.GetAsync(month, year);
    }
}