using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Core.Interfaces;

public interface IExpenseRepository
{
    Task<Result<Expense>> AddAsync(Expense expense);
    Task<Result<IEnumerable<Expense>>> GetAllAsync();
    Task<Result<IEnumerable<Expense>>> GetAllAsync(int? month = null, int? year = null);
    Task<Result<IEnumerable<Expense>>> GetAllAsync(int? month = null, int? year = null, Guid? categoryId = null);
    Task<Result<IEnumerable<Expense>>> GetAllAsync(int? month = null, int? year = null, IEnumerable<Guid>? categoryIds = null);
    Task<Result<Expense?>> UpdateAsync(Guid id, string? name = null, decimal? amount = null, Guid? categoryId = null);
    Task<Result<bool>> DeleteAsync(Guid id);
}