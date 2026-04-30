namespace FRMS_API.DTOs;

public sealed class TicketDto
{
    public int RequestID { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public int DepartmentID { get; set; }
    public string? DepartmentName { get; set; }

    public int RequesterID { get; set; }

    public int? AssignedVendorID { get; set; }
    public string? AssignedVendorName { get; set; }

    public string? ResolutionNotes { get; set; }
    public DateTime? CompletedAt { get; set; }

    public string? IssueImageUrl { get; set; }
}
