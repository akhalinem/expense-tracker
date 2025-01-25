using System.CommandLine;
using ExpenseTracker.Cli.Services;

namespace ExpenseTracker.Cli;

class Program
{
    static async Task Main(string[] args)
    {
        var expenseTrackerService = new ExpenseTrackerService();
        var cliService = new CliService(expenseTrackerService);
        var rootCommand = cliService.BuildCommandLine();

        if (args.Length == 0)
        {
            await RunInteractiveMode(rootCommand);
            return;
        }

        await rootCommand.InvokeAsync(args);
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