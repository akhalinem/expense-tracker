using Microsoft.EntityFrameworkCore;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Models;
using ExpenseTracker.Infrastructure.Data;

namespace ExpenseTracker.Infrastructure.Repositories;

public class ExpenseRepository : IExpenseRepository
{
    private readonly ExpenseTrackerDbContext _context;

    public ExpenseRepository(ExpenseTrackerDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Expense>> AddAsync(Expense expense)
    {
        try
        {
            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();
            return Result<Expense>.Success(expense);
        }
        catch (Exception ex)
        {
            return Result<Expense>.Failure(ex.Message);
        }
    }

    public async Task<Result<bool>> DeleteAsync(Guid id)
    {
        try
        {
            var expense = await _context.Expenses.FindAsync(id);
            if (expense == null)
            {
                return Result<bool>.Failure("Expense not found");
            }

            _context.Expenses.Remove(expense);
            await _context.SaveChangesAsync();
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }

    public async Task<Result<IEnumerable<Expense>>> GetAllAsync(int? month = null, int? year = null, Guid? categoryId = null)
    {
        try
        {
            var expenses = _context.Expenses.Include(x => x.Category).AsQueryable();

            if (month.HasValue)
            {
                expenses = expenses.Where(e => e.CreatedAt.Month == month);
            }

            if (year.HasValue)
            {
                expenses = expenses.Where(e => e.CreatedAt.Year == year);
            }

            if (categoryId != null)
            {
                expenses = expenses.Where(e => e.CategoryId == categoryId);
            }

            return Result<IEnumerable<Expense>>.Success(await expenses.ToListAsync());
        }
        catch (Exception ex)
        {
            return Result<IEnumerable<Expense>>.Failure(ex.Message);
        }
    }

    public async Task<Result<IEnumerable<Expense>>> GetAllAsync()
    {
        try
        {
            var expenses = _context.Expenses.Include(x => x.Category).AsQueryable();

            return Result<IEnumerable<Expense>>.Success(await expenses.ToListAsync());
        }
        catch (Exception ex)
        {
            return Result<IEnumerable<Expense>>.Failure(ex.Message);
        }
    }

    public async Task<Result<IEnumerable<Expense>>> GetAllAsync(int? month = null, int? year = null)
    {
        try
        {
            var expenses = _context.Expenses.Include(x => x.Category).AsQueryable();

            if (month.HasValue)
            {
                expenses = expenses.Where(e => e.CreatedAt.Month == month);
            }

            if (year.HasValue)
            {
                expenses = expenses.Where(e => e.CreatedAt.Year == year);
            }

            return Result<IEnumerable<Expense>>.Success(await expenses.ToListAsync());
        }
        catch (Exception ex)
        {
            return Result<IEnumerable<Expense>>.Failure(ex.Message);
        }
    }

    public async Task<Result<IEnumerable<Expense>>> GetAllAsync(int? month = null, int? year = null, IEnumerable<Guid>? categoryIds = null)
    {
        try
        {
            var expenses = _context.Expenses.Include(x => x.Category).AsEnumerable();

            if (month.HasValue)
            {
                expenses = expenses.Where(e => e.CreatedAt.Month == month);
            }

            if (year.HasValue)
            {
                expenses = expenses.Where(e => e.CreatedAt.Year == year);
            }

            if (categoryIds != null)
            {
                expenses = expenses.Where(e => e.CategoryId.HasValue && categoryIds.Contains(e.CategoryId.Value));
            }

            return Result<IEnumerable<Expense>>.Success(expenses.ToList());
        }
        catch (Exception ex)
        {
            return Result<IEnumerable<Expense>>.Failure(ex.Message);
        }
    }

    public async Task<Result<Expense?>> UpdateAsync(Guid id, string? name = null, decimal? amount = null, Guid? categoryId = null)
    {
        try
        {
            var expense = await _context.Expenses.FindAsync(id);
            if (expense == null)
            {
                return Result<Expense?>.Failure("Expense not found");
            }

            if (name != null) expense.Name = name;
            if (amount.HasValue) expense.Amount = amount.Value;
            if (categoryId != null) expense.CategoryId = categoryId;
            expense.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return Result<Expense?>.Success(expense);
        }
        catch (Exception ex)
        {
            return Result<Expense?>.Failure(ex.Message);
        }
    }
}