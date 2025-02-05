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

    public async Task<Result<IEnumerable<Expense>>> GetAllAsync(int? month = null, int? year = null, string? category = null)
    {
        try
        {
            var expenses = _context.Expenses.AsQueryable();

            if (month.HasValue)
            {
                expenses = expenses.Where(e => e.CreatedAt.Month == month);
            }

            if (year.HasValue)
            {
                expenses = expenses.Where(e => e.CreatedAt.Year == year);
            }

            if (!string.IsNullOrWhiteSpace(category))
            {
                expenses = expenses.Where(e => e.Category == category);
            }

            return Result<IEnumerable<Expense>>.Success(await expenses.ToListAsync());
        }
        catch (Exception ex)
        {
            return Result<IEnumerable<Expense>>.Failure(ex.Message);
        }
    }

    public async Task<Result<Expense?>> UpdateAsync(Guid id, string? name = null, decimal? amount = null, string? category = null)
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
            if (category != null) expense.Category = category;
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