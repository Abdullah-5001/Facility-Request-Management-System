using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FRMS_API.Models
{
    public class FacilityRequest
    {
        [Key]
        public int RequestID { get; set; }

        [Required]
        [StringLength(150)]
        public string Title { get; set; } = null!;

        [Required]
        public string Description { get; set; } = null!;

        // Exact location of the issue (room/building/etc.)
        [Required]
        [StringLength(200)]
        public string Location { get; set; } = null!;

        // Optional issue image (served by API static files)
        [StringLength(500)]
        public string? IssueImageUrl { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = "Pending";
        // Pending, Approved, In Progress, Completed, Rejected

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Vendor completion notes (visible to Admin + original Requester)
        [StringLength(2000)]
        public string? ResolutionNotes { get; set; }

        public DateTime? CompletedAt { get; set; }

        // Routing: Which department is this for?
        [Required]
        public int DepartmentID { get; set; }
        [ForeignKey("DepartmentID")]
        public virtual Department? Department { get; set; }

        // Who made the request?
        [Required]
        public int RequesterID { get; set; }
        [ForeignKey("RequesterID")]
        public virtual User? Requester { get; set; }

        // Assignment: Internal Worker OR External Vendor
        public int? AssignedWorkerID { get; set; }
        [ForeignKey("AssignedWorkerID")]
        public virtual User? AssignedWorker { get; set; }

        public int? AssignedVendorID { get; set; }
        [ForeignKey("AssignedVendorID")]
        public virtual Vendor? AssignedVendor { get; set; }
    }
}
