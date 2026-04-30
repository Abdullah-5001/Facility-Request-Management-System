using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace FRMS_API.DTOs;

public sealed class CreateTicketWithPhotoDto
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

    public IFormFile? Photo { get; set; }
}
