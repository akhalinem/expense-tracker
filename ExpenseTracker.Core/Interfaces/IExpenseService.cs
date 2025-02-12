using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Core.Interfaces;

public interface IExpenseService
{
    Task<Result<Expense>> Add(string name, decimal amount);
    Task<Result<Expense>> Add(string name, decimal amount, Guid? categoryId = null);
    Task<Result<Expense>> Add(string name, decimal amount, string? category = null);
    Task<Result<IEnumerable<Expense>>> List();
    Task<Result<IEnumerable<Expense>>> List(int? month = null, int? year = null);
    Task<Result<IEnumerable<Expense>>> List(int? month = null, int? year = null, Guid? categoryId = null);
    Task<Result<IEnumerable<Expense>>> List(int? month = null, int? year = null, string? category = null);
    Task<Result<Expense?>> Update(Guid id, string? name = null, decimal? amount = null);
    Task<Result<Expense?>> Update(Guid id, string? name = null, decimal? amount = null, Guid? categoryId = null);
    Task<Result<Expense?>> Update(Guid id, string? name = null, decimal? amount = null, string? category = null);
    Task<Result<bool>> Delete(Guid id);
    Task<Result<decimal>> GetTotal(int? month = null, int? year = null);
}