using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Core.Interfaces;

public interface IExpenseRepository
{
    Task<Result<Expense>> AddAsync(Expense expense);
    Task<Result<IEnumerable<Expense>>> GetAllAsync(int? month = null, int? year = null, string? category = null);
    Task<Result<Expense?>> UpdateAsync(Guid id, string? name = null, decimal? amount = null, string? category = null);
    Task<Result<bool>> DeleteAsync(Guid id);
}