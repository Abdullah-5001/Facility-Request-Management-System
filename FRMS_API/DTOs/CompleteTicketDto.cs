using System.ComponentModel.DataAnnotations;

namespace FRMS_API.DTOs;

public sealed class CompleteTicketDto
{
    [Required]
    [StringLength(2000)]
    public string ResolutionNotes { get; set; } = null!;
}
