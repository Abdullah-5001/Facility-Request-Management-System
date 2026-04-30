namespace FRMS_API.Helpers;

public static class TicketStatuses
{
    public const string Pending = "Pending";
    public const string Approved = "Approved";
    public const string InProgress = "In Progress";
    public const string Completed = "Completed";
    public const string Rejected = "Rejected";

    public static bool IsValid(string? status)
    {
        return status is Pending or Approved or InProgress or Completed or Rejected;
    }
}
