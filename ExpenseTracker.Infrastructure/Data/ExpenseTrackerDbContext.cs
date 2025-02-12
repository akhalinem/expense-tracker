using ExpenseTracker.Core.Models;
using Microsoft.EntityFrameworkCore;

namespace ExpenseTracker.Infrastructure.Data;

public class ExpenseTrackerDbContext : DbContext
{
    public ExpenseTrackerDbContext(DbContextOptions options) : base(options) { }

    public DbSet<Expense> Expenses { get; set; }
    public DbSet<Budget> Budgets { get; set; }
    public DbSet<Category> Categories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Expense>(entity =>
        {
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
        });

        modelBuilder.Entity<Budget>(entity =>
        {
            entity.HasKey(b => new { b.Year, b.Month });
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
        });
    }
}