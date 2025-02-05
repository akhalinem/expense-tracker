using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Models;
using ExpenseTracker.Infrastructure.Data;
using ExpenseTracker.Infrastructure.Repositories;
using ExpenseTracker.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Tests;

public class ExpenseServiceTests
{
    private readonly ExpenseTrackerDbContext _dbContext;
    private readonly IExpenseRepository _expenseRepository;
    private readonly IExpenseService _expenseService;

    public ExpenseServiceTests()
    {
        var options = new DbContextOptionsBuilder<ExpenseTrackerDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _dbContext = new ExpenseTrackerDbContext(options);
        _expenseRepository = new ExpenseRepository(_dbContext);
        _expenseService = new ExpenseService(_expenseRepository);
    }



    [Fact]
    public async Task Add_ShouldCreateNewExpense()
    {
        // Arrange

        // Act
        var result = await _expenseService.Add("Test", 100m);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal("Test", result.Value!.Name);
        Assert.Equal(100m, result.Value.Amount);
    }

    [Fact]
    public async Task GetTotal_WithoutParameters_ShouldReturnCurrentMonthTotal()
    {
        // Arrange
        var now = DateTime.Now;
        var lastMonth = now.AddMonths(-1);
        await _expenseRepository.AddAsync(
            new Expense { Name = "Current Month Expense", Amount = 100m, CreatedAt = now }
        );
        await _expenseRepository.AddAsync(
            new Expense { Name = "Last Month Expense", Amount = 200m, CreatedAt = lastMonth }
        );

        // Act
        var result = await _expenseService.GetTotal();

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(100m, result.Value);
    }

    [Fact]
    public async Task GetTotal_WithSpecificMonthAndYear_ShouldReturnFilteredTotal()
    {
        // Arrange
        var date2024Jan = new DateTime(2024, 1, 1);
        var date2024Feb = new DateTime(2024, 2, 1);

        await _expenseRepository.AddAsync(
            new Expense { Name = "Jan Expense", Amount = 100m, CreatedAt = date2024Jan }
        );
        await _expenseRepository.AddAsync(
            new Expense { Name = "Feb Expense", Amount = 200m, CreatedAt = date2024Feb }
         );

        // Act
        var result = await _expenseService.GetTotal(1, 2024);

        // Assert 
        Assert.True(result.IsSuccess);
        Assert.Equal(100m, result.Value);
    }

    [Fact]
    public async Task Update_ShouldModifyExpense()
    {
        // Arrange
        var addResult = await _expenseService.Add("Test", 100m);
        var id = addResult.Value!.Id;

        // Act
        var updateResult = await _expenseService.Update(id, "Updated", 200m);

        // Assert
        Assert.True(updateResult.IsSuccess);
        Assert.Equal("Updated", updateResult.Value!.Name);
        Assert.Equal(200m, updateResult.Value.Amount);
    }

    [Fact]
    public async Task Delete_ShouldRemoveExpense()
    {
        // Arrange
        var addResult = await _expenseService.Add("Test", 100m);
        var id = addResult.Value!.Id;

        // Act
        var deleteResult = await _expenseService.Delete(id);

        // Assert
        Assert.True(deleteResult.IsSuccess);
        var listResult = await _expenseService.List();
        Assert.Empty(listResult.Value!);
    }

    [Fact]
    public async Task GetSummary_ShouldCalculateTotal()
    {
        // Arrange
        await _expenseService.Add("Test1", 100m);
        await _expenseService.Add("Test2", 200m);

        // Act
        var result = await _expenseService.GetTotal();

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(300m, result.Value!);
    }
}