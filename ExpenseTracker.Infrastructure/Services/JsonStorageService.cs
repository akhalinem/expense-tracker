using System.Text.Json;

using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Infrastructure.Services;

public class JsonStorageService<T> : IStorageService<T>
{
    private readonly string _filePath;
    private readonly JsonSerializerOptions _options = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public JsonStorageService(string filePath) => _filePath = filePath;

    public Result<IEnumerable<T>> Load()
    {
        try
        {
            if (!File.Exists(_filePath))
                return Result<IEnumerable<T>>.Success(new List<T>());

            var json = File.ReadAllText(_filePath);
            var items = JsonSerializer.Deserialize<List<T>>(json, _options);
            return Result<IEnumerable<T>>.Success(items ?? new List<T>());
        }
        catch (Exception ex)
        {
            return Result<IEnumerable<T>>.Failure($"Failed to load data: {ex.Message}");
        }
    }

    public Result<bool> Save(IEnumerable<T> items)
    {
        try
        {
            var json = JsonSerializer.Serialize(items, _options);
            File.WriteAllText(_filePath, json);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"Failed to save data: {ex.Message}");
        }
    }
}