using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Models;
using ExpenseTracker.Infrastructure.Services;

namespace ExpenseTracker.Core.Tests;

public class ExpenseServiceTests : IDisposable
{
    private readonly string _testFilePath;
    private readonly JsonStorageService<Expense> _storage;
    private readonly IExpenseService _expenseService;

    public ExpenseServiceTests()
    {
        _testFilePath = Path.Combine(Path.GetTempPath(), $"test-{Guid.NewGuid()}.json");
        _storage = new JsonStorageService<Expense>(_testFilePath);
        _expenseService = new ExpenseService(_storage);
    }

    [Fact]
    public void Add_ShouldCreateNewExpense()
    {
        // Arrange

        // Act
        var result = _expenseService.Add("Test", 100m);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal("Test", result.Value!.Name);
        Assert.Equal(100m, result.Value.Amount);
    }

    [Fact]
    public void GetTotal_WithoutParameters_ShouldReturnCurrentMonthTotal()
    {
        // Arrange
        var now = DateTime.Now;
        var lastMonth = now.AddMonths(-1);
        _storage.Save([
           new Expense { Name = "Current Month Expense", Amount = 100m, CreatedAt = now },
            new Expense { Name = "Last Month Expense", Amount = 200m, CreatedAt = lastMonth }
        ]);
        var expenseService = new ExpenseService(_storage);

        // Act
        var result = expenseService.GetTotal();

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(100m, result.Value);
    }

    [Fact]
    public void GetTotal_WithSpecificMonthAndYear_ShouldReturnFilteredTotal()
    {
        // Arrange
        var date2024Jan = new DateTime(2024, 1, 1);
        var date2024Feb = new DateTime(2024, 2, 1);

        _storage.Save([
            new Expense { Name = "Jan Expense", Amount = 100m, CreatedAt = date2024Jan },
            new Expense { Name = "Feb Expense", Amount = 200m, CreatedAt = date2024Feb }
        ]);
        var expenseService = new ExpenseService(_storage);

        // Act
        var result = expenseService.GetTotal(1, 2024);

        // Assert 
        Assert.True(result.IsSuccess);
        Assert.Equal(100m, result.Value);
    }

    [Fact]
    public void Update_ShouldModifyExpense()
    {
        // Arrange
        var addResult = _expenseService.Add("Test", 100m);
        var id = addResult.Value!.Id;

        // Act
        var updateResult = _expenseService.Update(id, "Updated", 200m);

        // Assert
        Assert.True(updateResult.IsSuccess);
        Assert.Equal("Updated", updateResult.Value!.Name);
        Assert.Equal(200m, updateResult.Value.Amount);
    }

    [Fact]
    public void Delete_ShouldRemoveExpense()
    {
        // Arrange
        var addResult = _expenseService.Add("Test", 100m);
        var id = addResult.Value!.Id;

        // Act
        var deleteResult = _expenseService.Delete(id);

        // Assert
        Assert.True(deleteResult.IsSuccess);
        var listResult = _expenseService.List();
        Assert.Empty(listResult.Value!);
    }

    [Fact]
    public void GetSummary_ShouldCalculateTotal()
    {
        // Arrange
        _expenseService.Add("Test1", 100m);
        _expenseService.Add("Test2", 200m);

        // Act
        var result = _expenseService.GetTotal();

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(300m, result.Value!);
    }

    public void Dispose()
    {
        if (File.Exists(_testFilePath))
        {
            File.Delete(_testFilePath);
        }
    }
}