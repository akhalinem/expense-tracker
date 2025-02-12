using Microsoft.EntityFrameworkCore;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Models;
using ExpenseTracker.Infrastructure.Data;

namespace ExpenseTracker.Infrastructure.Repositories;

public class CategoryRepository : ICategoryRepository
{
    private readonly ExpenseTrackerDbContext _context;

    public CategoryRepository(ExpenseTrackerDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Category>> AddAsync(Category category)
    {
        try
        {
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();
            return Result<Category>.Success(category);
        }
        catch (Exception ex)
        {
            return Result<Category>.Failure(ex.Message);
        }
    }

    public async Task<Result<bool>> DeleteAsync(Guid id)
    {
        try
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return Result<bool>.Failure("Category not found");
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }

    public async Task<Result<IEnumerable<Category>>> GetAllAsync()
    {
        try
        {
            var categories = _context.Categories.AsQueryable();

            return Result<IEnumerable<Category>>.Success(await categories.ToListAsync());
        }
        catch (Exception ex)
        {
            return Result<IEnumerable<Category>>.Failure(ex.Message);
        }
    }

    public async Task<Result<Category?>> UpdateAsync(Guid id, string name)
    {
        try
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return Result<Category?>.Failure("Category not found");
            }

            category.Name = name;

            await _context.SaveChangesAsync();
            return Result<Category?>.Success(category);
        }
        catch (Exception ex)
        {
            return Result<Category?>.Failure(ex.Message);
        }
    }

    public async Task<Result<Category?>> GetByNameAsync(string name)
    {
        try
        {
            var category = await _context.Categories.FirstOrDefaultAsync(c => c.Name == name);
            return Result<Category?>.Success(category);
        }
        catch (Exception ex)
        {
            return Result<Category?>.Failure(ex.Message);
        }
    }

    public async Task<Result<Category>> UpsertAsync(string name)
    {
        var category = await GetByNameAsync(name);
        if (category.IsSuccess)
        {
            return Result<Category>.Success(category.Value!);
        }

        return await AddAsync(new Category { Name = name });
    }
}