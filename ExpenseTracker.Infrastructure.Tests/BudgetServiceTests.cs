using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Infrastructure.Data;
using ExpenseTracker.Infrastructure.Repositories;
using ExpenseTracker.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Tests;

public class BudgetServiceTests
{
    private readonly ExpenseTrackerDbContext _dbContext;
    private readonly IBudgetRepository _budgetRepository;
    private readonly BudgetService _budgetService;

    public BudgetServiceTests()
    {
        var options = new DbContextOptionsBuilder<ExpenseTrackerDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _dbContext = new ExpenseTrackerDbContext(options);
        _budgetRepository = new BudgetRepository(_dbContext);
        _budgetService = new BudgetService(_budgetRepository);
    }

    [Fact]
    public async Task SetBudget_ShouldCreateNewBudget()
    {
        // Act
        var result = await _budgetService.SetBudget(1, 2024, 1000m);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(1, result.Value!.Month);
        Assert.Equal(2024, result.Value.Year);
        Assert.Equal(1000m, result.Value.Amount);
    }

    [Fact]
    public async Task GetBudget_ShouldRetrieveBudget()
    {
        // Arrange
        await _budgetService.SetBudget(1, 2024, 1000m);

        // Act
        var result = await _budgetService.GetBudget(1, 2024);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal(1000m, result.Value!.Amount);
    }

    [Fact]
    public async Task GetBudget_NonExistent_ShouldReturnNull()
    {
        // Act
        var result = await _budgetService.GetBudget(1, 2024);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Null(result.Value);
    }
}