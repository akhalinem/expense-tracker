using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Core.Interfaces;

public interface IExpenseService
{
    Task<Result<Expense>> Add(string name, decimal amount, string? category = null);
    Task<Result<IEnumerable<Expense>>> List(int? month = null, int? year = null, string? category = null);
    Task<Result<Expense?>> Update(Guid id, string? name = null, decimal? amount = null, string? category = null);
    Task<Result<bool>> Delete(Guid id);
    Task<Result<decimal>> GetTotal(int? month = null, int? year = null);
}