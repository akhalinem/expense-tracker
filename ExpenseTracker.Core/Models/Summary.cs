namespace ExpenseTracker.Core.Models;

public record Summary(
    decimal Total,
    decimal? BudgetAmount = null)
{
    public bool IsOverBudget => BudgetAmount.HasValue && Total > BudgetAmount;
    public decimal? Remaining => BudgetAmount.HasValue ? BudgetAmount - Total : null;
}