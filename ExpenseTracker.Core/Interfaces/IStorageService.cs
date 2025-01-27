using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Core.Interfaces;

public interface IStorageService<T>
{
    Result<IEnumerable<T>> Load();
    Result<bool> Save(IEnumerable<T> items);
}