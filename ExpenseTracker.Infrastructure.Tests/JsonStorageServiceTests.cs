using ExpenseTracker.Core.Models;
using ExpenseTracker.Infrastructure.Services;
using ExpenseTracker.TestUtils;

namespace ExpenseTracker.Core.Tests;

public class JsonStorageServiceTests : IDisposable
{
    private readonly string _testFilePath;
    private readonly JsonStorageService<Expense> _storage;

    public JsonStorageServiceTests()
    {
        _testFilePath = Path.Combine(Path.GetTempPath(), $"test-{Guid.NewGuid()}.json");
        _storage = new JsonStorageService<Expense>(_testFilePath);
    }

    public void Dispose()
    {
        if (File.Exists(_testFilePath))
        {
            File.Delete(_testFilePath);
        }
    }

    [Fact]
    public void Load_WhenFileDoesNotExist_ShouldReturnEmptyList()
    {
        // Arrange
        // Using default setup from constructor

        // Act
        var result = _storage.Load();

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Empty(result.Value!);
    }

    [Fact]
    public void Save_ShouldPersistData()
    {
        // Arrange
        var expense = TestDataHelper.CreateExpense();

        // Act
        var result = _storage.Save([expense]);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.True(File.Exists(_testFilePath));
    }
}