class Program
{
    static void Main(string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine("Please provide a command");
            return;
        }

        var command = args[0];

        switch (command)
        {
            case "add":
                Console.WriteLine("Add expense");
                break;

            case "list":
                Console.WriteLine("List expenses");
                break;

            case "update":
                Console.WriteLine("Update expense");
                break;

            case "delete":
                Console.WriteLine("Delete expense");
                break;

            case "summary":
                Console.WriteLine("Show summary");
                break;

            default:
                Console.WriteLine("Invalid command");
                break;
        }
    }
}