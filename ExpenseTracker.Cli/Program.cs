using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using ExpenseTracker.Infrastructure.Data;
using ExpenseTracker.Infrastructure.Utils;

namespace ExpenseTracker.Cli;

class Program
{
    static async Task Main(string[] args)
    {
        try
        {
            var configuration = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json", optional: false)
                .Build();

            var optionsBuilder = new DbContextOptionsBuilder<ExpenseTrackerDbContext>();
            optionsBuilder.UseSqlite(configuration.GetConnectionString("DefaultConnection"));

            using var context = new ExpenseTrackerDbContext(optionsBuilder.Options);
            var solutionDir = Directory.GetParent(Directory.GetCurrentDirectory())?.FullName;
            var dataDir = Path.Combine(solutionDir, "data");
            var backupDir = Path.Combine(dataDir, "backup");
            var seedDir = Path.Combine(dataDir, "seed");

            if (args.Length == 0)
            {
                Console.WriteLine("Please provide a command: seed, backup, or reset");
                Console.WriteLine($"Backup directory: {backupDir}");
                Console.WriteLine($"Seed directory: {seedDir}");
                return;
            }

            switch (args[0].ToLower())
            {
                case "seed":
                    if (!Directory.Exists(seedDir))
                    {
                        Console.WriteLine($"Error: Seed directory not found at {seedDir}");
                        return;
                    }
                    await DatabaseSeeder.SeedDatabase(context, seedDir);
                    Console.WriteLine("Database seeded successfully");
                    break;

                case "backup":
                    await DatabaseBackup.CreateBackup(context, backupDir);
                    Console.WriteLine($"Database backed up successfully to {backupDir}");
                    break;

                case "reset":
                    Console.Write("Are you sure you want to reset the database? This will delete all data. [y/N]: ");
                    var response = Console.ReadLine()?.ToLower();
                    if (response == "y" || response == "yes")
                    {
                        await DatabaseBackup.ResetDatabase(context);
                        Console.WriteLine("Database reset successfully");
                    }
                    else
                    {
                        Console.WriteLine("Operation cancelled");
                    }
                    break;

                default:
                    Console.WriteLine("Unknown command. Use: seed, backup, or reset");
                    break;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            Environment.Exit(1);
        }
    }
}