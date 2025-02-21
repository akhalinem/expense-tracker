using ExpenseTracker.Core.Models;
using ExpenseTracker.Infrastructure.Data;
using ExpenseTracker.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Tests.Repositories;

public class CategoryRepositoryTests
{
    private readonly ExpenseTrackerDbContext _context;
    private readonly CategoryRepository _repository;

    public CategoryRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<ExpenseTrackerDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _context = new ExpenseTrackerDbContext(options);
        _repository = new CategoryRepository(_context);
    }

    [Fact]
    public async Task GetByName_WhenCategoryExists_ShouldReturnCategory()
    {
        // Arrange
        var category = new Category { Name = "Test" };
        await _context.Categories.AddAsync(category);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByNameAsync("Test");

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal("Test", result.Value.Name);
    }

    [Fact]
    public async Task Upsert_WhenCategoryDoesNotExist_ShouldCreateNew()
    {
        // Act
        var result = await _repository.UpsertAsync("New Category");

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal("New Category", result.Value?.Name);
        Assert.NotEqual(Guid.Empty, result.Value?.Id);
    }

    [Fact]
    public async Task Delete_ShouldRemoveCategory()
    {
        // Arrange
        var category = new Category { Name = "Test" };
        await _context.Categories.AddAsync(category);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.DeleteAsync(category.Id);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Empty(await _context.Categories.ToListAsync());
    }
}
