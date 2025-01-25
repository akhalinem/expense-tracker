using ExpenseTracker.Cli.Models;

namespace ExpenseTracker.Cli.Interfaces;

public interface IStorageService<T>
{
    Result<IEnumerable<T>> Load();
    Result<bool> Save(IEnumerable<T> items);
}