using System.ComponentModel.DataAnnotations;

namespace FRMS_API.Models
{
    public class Vendor
    {
        [Key]
        public int VendorID { get; set; }

        [Required]
        [StringLength(150)]
        public string CompanyName { get; set; } = null!;

        [StringLength(100)]
        public string? ContactPerson { get; set; }

        [StringLength(50)]
        public string? PhoneNumber { get; set; }

        [EmailAddress]
        [StringLength(150)]
        public string? Email { get; set; }
    }
}
