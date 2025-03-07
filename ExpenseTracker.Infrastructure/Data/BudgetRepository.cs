using Microsoft.EntityFrameworkCore;
using ExpenseTracker.Core.Models;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Infrastructure.Data;

namespace ExpenseTracker.Infrastructure.Repositories;

public class BudgetRepository : IBudgetRepository
{
    private readonly ExpenseTrackerDbContext _context;

    public BudgetRepository(ExpenseTrackerDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Budget>> SetAsync(int month, int year, decimal amount)
    {
        try
        {
            var budget = await _context.Budgets.FindAsync(year, month);
            if (budget == null)
            {
                budget = new Budget { Year = year, Month = month, Amount = amount };
                _context.Budgets.Add(budget);
            }
            else
            {
                budget.Amount = amount;
            }

            await _context.SaveChangesAsync();
            return Result<Budget>.Success(budget);
        }
        catch (Exception ex)
        {
            return Result<Budget>.Failure(ex.Message);
        }
    }

    public async Task<Result<Budget?>> GetAsync(int month, int year)
    {
        try
        {
            var budget = await _context.Budgets.FindAsync(year, month);
            return Result<Budget?>.Success(budget);
        }
        catch (Exception ex)
        {
            return Result<Budget?>.Failure(ex.Message);
        }
    }

    public async Task<Result<IEnumerable<Budget>>> GetHistoryAsync()
    {
        try
        {
            var budgets = await _context.Budgets
                .Where(x => x.Year < DateTime.Now.Year || (x.Year == DateTime.Now.Year && x.Month < DateTime.Now.Month))
                .OrderByDescending(x => x.Year)
                .ThenByDescending(x => x.Month)
                .ToListAsync();

            return Result<IEnumerable<Budget>>.Success(budgets);
        }
        catch (Exception ex)
        {
            return Result<IEnumerable<Budget>>.Failure(ex.Message);
        }
    }

    public async Task<Result<bool>> DeleteAsync(int month, int year)
    {
        try
        {
            var budget = await _context.Budgets.FindAsync(year, month);
            if (budget == null)
                return Result<bool>.Failure("Budget not found");

            _context.Budgets.Remove(budget);
            await _context.SaveChangesAsync();
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure(ex.Message);
        }
    }

    public async Task<Result<IEnumerable<Budget>>> ListAsync(int? month, int? year = null)
    {
        try
        {
            var query = _context.Budgets.AsQueryable();

            if (year.HasValue)
                query = query.Where(b => b.Year == year);

            var budgets = await query.ToListAsync();
            return Result<IEnumerable<Budget>>.Success(budgets);
        }
        catch (Exception ex)
        {
            return Result<IEnumerable<Budget>>.Failure(ex.Message);
        }
    }
}