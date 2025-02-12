using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Core.Interfaces;

public interface ICategoryRepository
{
    Task<Result<Category>> AddAsync(Category category);
    Task<Result<IEnumerable<Category>>> GetAllAsync();
    Task<Result<Category?>> GetByNameAsync(string name);
    Task<Result<Category?>> UpdateAsync(Guid id, string name);
    Task<Result<Category>> UpsertAsync(string name);
    Task<Result<bool>> DeleteAsync(Guid id);
}