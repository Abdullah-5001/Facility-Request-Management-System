using System.ComponentModel.DataAnnotations;

namespace FRMS_API.DTOs;

public sealed class UpdateTicketStatusDto
{
    [Required]
    [StringLength(50)]
    public string Status { get; set; } = null!;

    [StringLength(255)]
    public string? Comments { get; set; }
}
