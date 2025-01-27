namespace ExpenseTracker.Core.Models;

public class Expense
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public decimal Amount { get; set; }
    public string? Category { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; } = null;
}

