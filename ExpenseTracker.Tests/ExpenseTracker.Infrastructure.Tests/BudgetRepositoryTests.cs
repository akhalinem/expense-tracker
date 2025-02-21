using ExpenseTracker.Core.Models;
using ExpenseTracker.Infrastructure.Data;
using ExpenseTracker.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Tests.Repositories;

public class BudgetRepositoryTests
{
    private readonly ExpenseTrackerDbContext _context;
    private readonly BudgetRepository _repository;

    public BudgetRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<ExpenseTrackerDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new ExpenseTrackerDbContext(options);
        _repository = new BudgetRepository(_context);
    }

    [Fact]
    public async Task GetAsync_WhenBudgetExists_ShouldReturnBudget()
    {
        // Arrange
        var budget = new Budget { Month = 1, Year = 2024, Amount = 1000m };
        await _context.Budgets.AddAsync(budget);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAsync(1, 2024);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal(1000m, result.Value.Amount);
    }

    [Fact]
    public async Task SetAsync_ShouldCreateOrUpdateBudget()
    {
        // Act
        var result = await _repository.SetAsync(1, 2024, 1000m);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(1000m, result.Value?.Amount);
        Assert.Equal(1, result.Value?.Month);
        Assert.Equal(2024, result.Value?.Year);
    }

    [Fact]
    public async Task SetAsync_WithExistingBudget_ShouldUpdate()
    {
        // Arrange
        await _repository.SetAsync(1, 2024, 1000m);

        // Act
        var result = await _repository.SetAsync(1, 2024, 2000m);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(2000m, result.Value?.Amount);
    }
}
