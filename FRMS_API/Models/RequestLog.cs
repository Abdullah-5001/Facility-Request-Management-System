using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FRMS_API.Models
{
    public class RequestLog
    {
        [Key]
        public int LogID { get; set; }

        // Points to the new FacilityRequest table
        [Required]
        public int RequestID { get; set; }
        [ForeignKey("RequestID")]
        public virtual FacilityRequest FacilityRequest { get; set; } = null!;

        [Required]
        public int ChangedByUserID { get; set; }
        [ForeignKey("ChangedByUserID")]
        public virtual User ChangedByUser { get; set; } = null!;

        [StringLength(50)]
        public string? OldStatus { get; set; }

        [StringLength(50)]
        public string? NewStatus { get; set; }

        public DateTime? ChangedDate { get; set; } = DateTime.Now;

        [StringLength(255)]
        public string? Comments { get; set; }
    }
}
