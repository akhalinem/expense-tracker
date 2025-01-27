namespace ExpenseTracker.Core.Models;

public class Budget
{
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal Amount { get; set; } = 0;
}