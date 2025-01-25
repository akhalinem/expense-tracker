using ExpenseTracker.Cli.Models;

namespace ExpenseTracker.Cli.Helpers;

public static class CsvExporter
{
    public static Result<bool> Export<T>(
        string filePath,
        IEnumerable<T> items,
        string header,
        Func<T, string> formatRow)
    {
        try
        {
            using var writer = new StreamWriter(filePath);
            writer.WriteLine(header);

            foreach (var item in items)
            {
                writer.WriteLine(formatRow(item));
            }

            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure($"Failed to export: {ex.Message}");
        }
    }

    public static string EscapeCsvField(string field) =>
        field.Contains(",") || field.Contains("\"") || field.Contains("\n")
            ? $"\"{field.Replace("\"", "\"\"")}\""
            : field;
}