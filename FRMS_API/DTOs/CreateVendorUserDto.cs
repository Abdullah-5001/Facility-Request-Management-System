using System.ComponentModel.DataAnnotations;

namespace FRMS_API.DTOs;

public sealed class CreateVendorUserDto
{
    [Required]
    [StringLength(100)]
    public string FullName { get; set; } = null!;

    [Required]
    [EmailAddress]
    [StringLength(150)]
    public string Email { get; set; } = null!;

    [Required]
    [MinLength(6)]
    [StringLength(100)]
    public string Password { get; set; } = null!;
}
