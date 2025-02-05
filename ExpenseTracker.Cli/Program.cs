using System.CommandLine;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Infrastructure.Services;
using ExpenseTracker.Infrastructure.Repositories;
using ExpenseTracker.Infrastructure.Data;
using ExpenseTracker.Cli.Services;

namespace ExpenseTracker.Cli;

class Program
{
    static async Task Main(string[] args)
    {
        var services = ConfigureServices();
        var cliService = services.GetRequiredService<CliService>();
        var rootCommand = cliService.BuildCommandLine();

        if (args.Length == 0)
        {
            await RunInteractiveMode(rootCommand);
            return;
        }

        await rootCommand.InvokeAsync(args);
    }

    private static ServiceProvider ConfigureServices()
    {

        IConfiguration configuration = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json")
            .Build();

        return new ServiceCollection()
            .AddScoped<IExpenseRepository, ExpenseRepository>()
            .AddScoped<IBudgetRepository, BudgetRepository>()
            .AddScoped<IExpenseService, ExpenseService>()
            .AddScoped<IBudgetService, BudgetService>()
            .AddScoped<CliService>()
            .AddDbContext<ExpenseTrackerDbContext>(options =>
                options.UseSqlite(configuration.GetConnectionString("DefaultConnection")))
            .BuildServiceProvider();
    }

    private static async Task RunInteractiveMode(RootCommand rootCommand)
    {
        while (true)
        {
            Console.Write("> ");
            var input = Console.ReadLine();

            if (string.IsNullOrWhiteSpace(input))
                continue;

            if (input.ToLower() == "exit")
                break;

            var commandArgs = input.Split(' ', StringSplitOptions.RemoveEmptyEntries);

            await rootCommand.InvokeAsync(commandArgs);
        }
    }
}