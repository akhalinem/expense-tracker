using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using ExpenseTracker.Infrastructure.Data;

public class ExpenseTrackerDbContextFactory : IDesignTimeDbContextFactory<ExpenseTrackerDbContext>
{
    public ExpenseTrackerDbContext CreateDbContext(string[] args)
    {
        var configPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "config");

        var configuration = new ConfigurationBuilder()
            .SetBasePath(configPath)
            .AddJsonFile("settings.json", optional: false)
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<ExpenseTrackerDbContext>();
        optionsBuilder.UseSqlite(configuration.GetConnectionString("DefaultConnection"));

        return new ExpenseTrackerDbContext(optionsBuilder.Options);
    }
}