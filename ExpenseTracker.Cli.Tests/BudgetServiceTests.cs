using ExpenseTracker.Cli.Interfaces;
using ExpenseTracker.Cli.Models;
using ExpenseTracker.Cli.Services;

namespace ExpenseTracker.Cli.Tests;

public class BudgetServiceTests : IDisposable
{
    private readonly string _testFilePath;
    private readonly JsonStorageService<Budget> _storage;
    private readonly IBudgetService _budgetService;

    public BudgetServiceTests()
    {
        _testFilePath = Path.Combine(Path.GetTempPath(), "test-budgets.json");
        _storage = new JsonStorageService<Budget>(_testFilePath);
        _budgetService = new BudgetService(_storage);
    }

    [Fact]
    public void SetBudget_ShouldCreateNewBudget()
    {
        // Act
        var result = _budgetService.SetBudget(1, 2024, 1000m);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(1, result.Value!.Month);
        Assert.Equal(2024, result.Value.Year);
        Assert.Equal(1000m, result.Value.Amount);
    }

    [Fact]
    public void GetBudget_ShouldRetrieveBudget()
    {
        // Arrange
        _budgetService.SetBudget(1, 2024, 1000m);

        // Act
        var result = _budgetService.GetBudget(1, 2024);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal(1000m, result.Value!.Amount);
    }

    [Fact]
    public void GetBudget_NonExistent_ShouldReturnNull()
    {
        // Act
        var result = _budgetService.GetBudget(1, 2024);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Null(result.Value);
    }

    public void Dispose()
    {
        if (File.Exists(_testFilePath))
        {
            File.Delete(_testFilePath);
        }
    }
}