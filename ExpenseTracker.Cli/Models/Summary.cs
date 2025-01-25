namespace ExpenseTracker.Cli.Models;

public class Summary
{
    public decimal Total { get; set; }
    public decimal? Budget { get; set; }
    public bool IsOverBudget => Budget.HasValue && Total > Budget;
    public decimal Remaining => Budget.HasValue ? Budget.Value - Total : Total;
}