using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Infrastructure.Services;

public class ExpenseService : IExpenseService
{
    private readonly IExpenseRepository _repository;

    public ExpenseService(IExpenseRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<Expense>> Add(string name, decimal amount, string? category = null)
    {
        var expense = new Expense
        {
            Name = name,
            Amount = amount,
            Category = category
        };

        return await _repository.AddAsync(expense);
    }

    public async Task<Result<IEnumerable<Expense>>> List(int? month = null, int? year = null, string? category = null)
    {
        return await _repository.GetAllAsync(month, year, category);
    }

    public async Task<Result<Expense?>> Update(Guid id, string? name = null, decimal? amount = null, string? category = null)
    {
        return await _repository.UpdateAsync(id, name, amount, category);
    }

    public async Task<Result<bool>> Delete(Guid id)
    {
        return await _repository.DeleteAsync(id);
    }

    public async Task<Result<decimal>> GetTotal(int? month = null, int? year = null)
    {
        var currentMonth = month ?? DateTime.Now.Month;
        var currentYear = year ?? DateTime.Now.Year;

        var expenses = await List(currentMonth, currentYear);
        if (!expenses.IsSuccess)
            return Result<decimal>.Failure(expenses.Error!);

        var total = expenses.Value!.Sum(e => e.Amount);
        return Result<decimal>.Success(total);
    }
}