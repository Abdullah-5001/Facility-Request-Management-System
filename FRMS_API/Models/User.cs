using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FRMS_API.Models
{
    public class User
    {
        [Key]
        public int UserID { get; set; }

        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = null!;

        [Required]
        [EmailAddress]
        [StringLength(150)]
        public string Email { get; set; } = null!;

        [Required]
        public string PasswordHash { get; set; } = null!;

        [Required]
        [StringLength(50)]
        public string Role { get; set; } = null!;
        // Roles: Requester, DeptHead, InternalWorker, Dean, DeputyRegistrar, VC, Admin

        // If the user is an authenticated vendor user, which vendor record do they represent?
        public int? VendorID { get; set; }
        [ForeignKey("VendorID")]
        public virtual Vendor? Vendor { get; set; }

        // If the user is a worker or head, which department do they belong to?
        public int? DepartmentID { get; set; }
        [ForeignKey("DepartmentID")]
        public virtual Department? Department { get; set; }
    }
}
