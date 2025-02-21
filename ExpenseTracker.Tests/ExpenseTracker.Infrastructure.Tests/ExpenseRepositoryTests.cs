using ExpenseTracker.Core.Models;
using ExpenseTracker.Infrastructure.Data;
using ExpenseTracker.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Tests.Repositories;

public class ExpenseRepositoryTests
{
    private readonly ExpenseTrackerDbContext _context;
    private readonly ExpenseRepository _repository;

    public ExpenseRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<ExpenseTrackerDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new ExpenseTrackerDbContext(options);
        _repository = new ExpenseRepository(_context);
    }

    [Fact]
    public async Task AddAsync_ShouldCreateNewExpense()
    {
        // Arrange
        var expense = new Expense { Name = "Test", Amount = 100m };

        // Act
        var result = await _repository.AddAsync(expense);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal("Test", result.Value?.Name);
        Assert.Equal(100m, result.Value?.Amount);
        Assert.NotEqual(Guid.Empty, result.Value?.Id);
    }

    [Fact]
    public async Task GetAllAsync_WithFilters_ShouldReturnFilteredExpenses()
    {
        // Arrange
        var category = new Category { Name = "Test Category" };
        await _context.Categories.AddAsync(category);

        var expense1 = new Expense { Name = "Jan Expense", Amount = 100m, CreatedAt = new DateTime(2024, 1, 1), CategoryId = category.Id };
        var expense2 = new Expense { Name = "Feb Expense", Amount = 200m, CreatedAt = new DateTime(2024, 2, 1) };
        await _context.Expenses.AddRangeAsync(expense1, expense2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAllAsync(1, 2024, category.Id);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Single(result.Value!);
        Assert.Equal("Jan Expense", result.Value!.First().Name);
    }

    [Fact]
    public async Task UpdateAsync_ShouldModifyExpense()
    {
        // Arrange
        var expense = new Expense { Name = "Test", Amount = 100m };
        await _context.Expenses.AddAsync(expense);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.UpdateAsync(expense.Id, "Updated", 200m);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal("Updated", result.Value!.Name);
        Assert.Equal(200m, result.Value.Amount);
        Assert.NotNull(result.Value.UpdatedAt);
    }

    [Fact]
    public async Task DeleteAsync_ShouldRemoveExpense()
    {
        // Arrange
        var expense = new Expense { Name = "Test", Amount = 100m };
        await _context.Expenses.AddAsync(expense);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.DeleteAsync(expense.Id);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Empty(await _context.Expenses.ToListAsync());
    }
}
