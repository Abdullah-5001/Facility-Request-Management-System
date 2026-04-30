using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FRMS_API.Models
{
    public class Department
    {
        [Key]
        public int DepartmentID { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = null!;
        // e.g., IT, Estate Management, Planning and Development, Academic, QAC, Exam

        // Navigation Property: The Head of this specific department
        public int? HeadUserID { get; set; }

        [ForeignKey(nameof(HeadUserID))]
        public virtual User? DepartmentHead { get; set; }
    }
}
