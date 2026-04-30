using System.ComponentModel.DataAnnotations;

namespace FRMS_API.DTOs;

public sealed class AssignVendorDto
{
    [Required]
    public int VendorID { get; set; }
}
