using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Core.Interfaces;

public interface IBudgetRepository
{
    Task<Result<Budget>> SetAsync(int month, int year, decimal amount);
    Task<Result<Budget?>> GetAsync(int month, int year);
    Task<Result<IEnumerable<Budget>>> GetHistoryAsync();
    Task<Result<bool>> DeleteAsync(int month, int year);
    Task<Result<IEnumerable<Budget>>> ListAsync(int? month = null, int? year = null);
}