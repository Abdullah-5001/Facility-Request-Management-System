using System.ComponentModel.DataAnnotations;

namespace FRMS_API.DTOs
{
    public class RegisterDto
    {
        [Required]
        public string FullName { get; set; } = null!;

        [Required, EmailAddress]
        public string Email { get; set; } = null!;

        [Required]
        public string Password { get; set; } = null!;

        [Required]
        public string Role { get; set; } = null!; // e.g., "Requester", "DeptHead", "Admin"
    }
}
