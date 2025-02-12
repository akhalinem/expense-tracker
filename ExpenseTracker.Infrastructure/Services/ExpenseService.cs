using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Infrastructure.Services;

public class ExpenseService : IExpenseService
{
    private readonly IExpenseRepository _expenseRepository;
    private readonly ICategoryRepository _categoryRepository;

    public ExpenseService(IExpenseRepository expenseRepository, ICategoryRepository categoryRepository)
    {
        _expenseRepository = expenseRepository;
        _categoryRepository = categoryRepository;
    }

    public async Task<Result<Expense>> Add(string name, decimal amount)
    {
        return await Add(name, amount, (Guid?)null);
    }

    public async Task<Result<Expense>> Add(string name, decimal amount, Guid? categoryId = null)
    {
        var expense = new Expense
        {
            Name = name,
            Amount = amount,
            CategoryId = categoryId
        };

        return await _expenseRepository.AddAsync(expense);
    }

    public async Task<Result<Expense>> Add(string name, decimal amount, string? category = null)
    {
        var categoryResult = category != null
            ? await _categoryRepository.UpsertAsync(category)
            : null;

        var expense = new Expense
        {
            Name = name,
            Amount = amount,
            CategoryId = categoryResult?.Value?.Id
        };

        return await _expenseRepository.AddAsync(expense);
    }

    public async Task<Result<IEnumerable<Expense>>> List()
    {
        return await _expenseRepository.GetAllAsync();
    }

    public async Task<Result<IEnumerable<Expense>>> List(int? month = null, int? year = null)
    {
        return await _expenseRepository.GetAllAsync(month, year);
    }

    public async Task<Result<IEnumerable<Expense>>> List(int? month = null, int? year = null, Guid? categoryId = null)
    {
        return await _expenseRepository.GetAllAsync(month, year, categoryId);
    }

    public async Task<Result<IEnumerable<Expense>>> List(int? month = null, int? year = null, string? category = null)
    {
        var categoryResult = category != null
            ? await _categoryRepository.GetByNameAsync(category)
            : null;

        return await _expenseRepository.GetAllAsync(month, year, categoryResult?.Value?.Id);
    }

    public async Task<Result<IEnumerable<Expense>>> List(int? month = null, int? year = null, IEnumerable<Guid>? categoryIds = null)
    {
        return await _expenseRepository.GetAllAsync(month, year, categoryIds);
    }

    public async Task<Result<Expense?>> Update(Guid id, string? name = null, decimal? amount = null)
    {
        return await _expenseRepository.UpdateAsync(id, name, amount);
    }

    public async Task<Result<Expense?>> Update(Guid id, string? name = null, decimal? amount = null, Guid? categoryId = null)
    {
        return await _expenseRepository.UpdateAsync(id, name, amount, categoryId);
    }

    public async Task<Result<Expense?>> Update(Guid id, string? name = null, decimal? amount = null, string? category = null)
    {
        var categoryResult = category != null
            ? await _categoryRepository.UpsertAsync(category)
            : null;

        return await _expenseRepository.UpdateAsync(id, name, amount, categoryResult?.Value?.Id);
    }

    public async Task<Result<bool>> Delete(Guid id)
    {
        return await _expenseRepository.DeleteAsync(id);
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