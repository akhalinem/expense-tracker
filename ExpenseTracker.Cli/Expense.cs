namespace ExpenseTracker.Cli;
class Expense
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public decimal Amount { get; set; }
    public DateTime CreatedOn { get; set; } = DateTime.Now;
    public DateTime? UpdatedOn { get; set; } = null;
}

