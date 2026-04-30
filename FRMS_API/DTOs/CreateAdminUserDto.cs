using System.ComponentModel.DataAnnotations;

namespace FRMS_API.DTOs;

public sealed class CreateAdminUserDto
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

    [Required]
    [StringLength(50)]
    public string Role { get; set; } = null!;

    public int? DepartmentID { get; set; }

    public int? VendorID { get; set; }
}