using ExpenseTracker.Cli.Models;

namespace ExpenseTracker.Cli.Interfaces;

public interface IExpenseService
{
    Result<Expense> Add(string name, decimal amount, string? category = null);
    Result<IEnumerable<Expense>> List(int? month = null, int? year = null, string? category = null);
    Result<Expense?> Update(Guid id, string? name = null, decimal? amount = null, string? category = null);
    Result<bool> Delete(Guid id);
    Result<decimal> GetTotal(int? month = null, int? year = null);
}