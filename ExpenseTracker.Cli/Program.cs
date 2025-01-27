using System.CommandLine;
using Microsoft.Extensions.DependencyInjection;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Models;
using ExpenseTracker.Core.Services;
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

    private static IServiceProvider ConfigureServices()
    {
        return new ServiceCollection()
            .AddSingleton<IStorageService<Expense>>(x =>
                new JsonStorageService<Expense>("expenses.json"))
            .AddSingleton<IStorageService<Budget>>(x =>
                new JsonStorageService<Budget>("budgets.json"))
            .AddSingleton<IExpenseService, ExpenseService>()
            .AddSingleton<IBudgetService, BudgetService>()
            .AddSingleton<CliService>()
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