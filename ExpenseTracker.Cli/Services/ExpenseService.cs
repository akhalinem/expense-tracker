using ExpenseTracker.Cli.Interfaces;
using ExpenseTracker.Cli.Models;

namespace ExpenseTracker.Cli.Services;

public class ExpenseService : IExpenseService
{
    private readonly IStorageService<Expense> _storage;
    private readonly List<Expense> _expenses;
    public ExpenseService(IStorageService<Expense> storage)
    {
        _storage = storage;
        var result = _storage.Load();
        _expenses = result.IsSuccess ? result.Value!.ToList() : [];
    }

    public Result<Expense> Add(string name, decimal amount, string? category = null)
    {
        var expense = new Expense
        {
            Name = name,
            Amount = amount,
            Category = category
        };

        _expenses.Add(expense);
        var result = _storage.Save(_expenses);
        return result.IsSuccess
            ? Result<Expense>.Success(expense)
            : Result<Expense>.Failure(result.Error!);
    }

    public Result<IEnumerable<Expense>> List(int? month = null, int? year = null, string? category = null)
    {
        var expenses = _expenses.AsEnumerable();

        if (month.HasValue)
            expenses = expenses.Where(e => e.CreatedAt.Month == month);

        if (year.HasValue)
            expenses = expenses.Where(e => e.CreatedAt.Year == year);

        if (category != null)
            expenses = expenses.Where(e => e.Category == category);

        return Result<IEnumerable<Expense>>.Success(expenses);
    }

    public Result<decimal> GetTotal(int? month = null, int? year = null)
    {
        var currentMonth = month ?? DateTime.Now.Month;
        var currentYear = year ?? DateTime.Now.Year;

        var expenses = List(currentMonth, currentYear);
        if (!expenses.IsSuccess)
            return Result<decimal>.Failure(expenses.Error!);

        var total = expenses.Value!.Sum(e => e.Amount);
        return Result<decimal>.Success(total);
    }

    public Result<Expense?> Update(Guid id, string? name = null, decimal? amount = null, string? category = null)
    {
        var expense = _expenses.FirstOrDefault(e => e.Id == id);
        if (expense == null)
            return Result<Expense?>.Failure("Expense not found");

        if (name != null) expense.Name = name;
        if (amount != null) expense.Amount = amount.Value;
        if (category != null) expense.Category = category;
        expense.UpdatedAt = DateTime.Now;

        var result = _storage.Save(_expenses);
        return result.IsSuccess
            ? Result<Expense?>.Success(expense)
            : Result<Expense?>.Failure(result.Error!);
    }

    public Result<bool> Delete(Guid id)
    {
        var expense = _expenses.FirstOrDefault(e => e.Id == id);
        if (expense == null)
            return Result<bool>.Failure("Expense not found");

        _expenses.Remove(expense);
        var result = _storage.Save(_expenses);
        return result;
    }
}