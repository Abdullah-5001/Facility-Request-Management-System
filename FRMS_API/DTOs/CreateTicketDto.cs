using System.ComponentModel.DataAnnotations;

namespace FRMS_API.DTOs;

public sealed class CreateTicketDto
{
    [Required]
    [StringLength(150)]
    public string Title { get; set; } = null!;

    [Required]
    public string Description { get; set; } = null!;

    [Required]
    [StringLength(200)]
    public string Location { get; set; } = null!;

    [Required]
    public int DepartmentID { get; set; }
}
