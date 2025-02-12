namespace ExpenseTracker.Core.Models;

public class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }

    public ICollection<Expense> Expenses { get; set; } = [];
}