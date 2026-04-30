using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FRMS_API.DB;
using FRMS_API.DTOs;
using FRMS_API.Helpers;
using FRMS_API.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.IO;

namespace FRMS_API.Controllers
{
    // Primary routes required by the specs: /api/tickets/*
    [Route("api/tickets")]
    [ApiController]
    [Authorize]
    public class FacilityRequestsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly NotificationHelper _notificationHelper;
        private readonly IWebHostEnvironment _environment;

        public FacilityRequestsController(ApplicationDbContext context, NotificationHelper notificationHelper, IWebHostEnvironment environment)
        {
            _context = context;
            _notificationHelper = notificationHelper;
            _environment = environment;
        }

        // Backward-compatible alias for older frontend code (optional)
        [HttpGet("/api/FacilityRequests")]
        [Authorize(Roles = Roles.Admin)]
        public Task<ActionResult<IEnumerable<TicketDto>>> LegacyGetAll()
        {
            // Behaves like admin view of approved tickets by default
            return GetTickets(status: TicketStatuses.Approved);
        }

        // GET: api/tickets?status=Approved
        // Admin view: all approved tickets across the university
        [HttpGet]
        [Authorize(Roles = Roles.Admin)]
        public async Task<ActionResult<IEnumerable<TicketDto>>> GetTickets([FromQuery] string? status)
        {
            var normalizedStatus = string.IsNullOrWhiteSpace(status) ? TicketStatuses.Approved : status.Trim();
            if (!TicketStatuses.IsValid(normalizedStatus))
            {
                return BadRequest("Invalid status filter.");
            }

            var tickets = await _context.FacilityRequests
                .AsNoTracking()
                .Include(r => r.Department)
                .Include(r => r.AssignedVendor)
                .Where(r => r.Status == normalizedStatus)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => ToDto(r))
                .ToListAsync();

            return tickets;
        }

        // GET: api/tickets/my
        // Requestor view: track status of submitted tickets
        [HttpGet("my")]
        [Authorize(Roles = Roles.Requester)]
        public async Task<ActionResult<IEnumerable<TicketDto>>> GetMyTickets()
        {
            var userId = User.GetRequiredUserId();
            var tickets = await _context.FacilityRequests
                .AsNoTracking()
                .Include(r => r.Department)
                .Include(r => r.AssignedVendor)
                .Where(r => r.RequesterID == userId)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => ToDto(r))
                .ToListAsync();

            return tickets;
        }

        // POST: api/tickets
        // Requestor submits a detailed facility issue
        [HttpPost]
        [Consumes("application/json")]
        [Authorize(Roles = Roles.Requester)]
        public async Task<ActionResult<TicketDto>> CreateTicket(CreateTicketDto dto)
        {
            var userId = User.GetRequiredUserId();

            var departmentExists = await _context.Departments.AnyAsync(d => d.DepartmentID == dto.DepartmentID);
            if (!departmentExists)
            {
                return BadRequest("Invalid department.");
            }

            // SQA check: ensure no null/empty values
            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Description) || string.IsNullOrWhiteSpace(dto.Location))
            {
                return BadRequest("Title, Description, and Location are required.");
            }

            var request = new FacilityRequest
            {
                Title = dto.Title.Trim(),
                Description = dto.Description.Trim(),
                Location = dto.Location.Trim(),
                DepartmentID = dto.DepartmentID,
                RequesterID = userId,
                Status = TicketStatuses.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.FacilityRequests.Add(request);

            // Save first to get the generated RequestID
            await _context.SaveChangesAsync();

            _context.RequestLogs.Add(new RequestLog
            {
                RequestID = request.RequestID,
                ChangedByUserID = userId,
                OldStatus = null,
                NewStatus = TicketStatuses.Pending,
                Comments = "Ticket created"
            });

            await _context.SaveChangesAsync();

            // Find the Department Head's email
            var targetDept = await _context.Departments
                .Include(d => d.DepartmentHead)
                .FirstOrDefaultAsync(d => d.DepartmentID == request.DepartmentID);

            var headEmail = targetDept?.DepartmentHead?.Email ?? "admin@ptut.edu.pk";
            _notificationHelper.SendNewRequestAlert(request, headEmail);

            var created = await _context.FacilityRequests
                .AsNoTracking()
                .Include(r => r.Department)
                .Include(r => r.AssignedVendor)
                .FirstAsync(r => r.RequestID == request.RequestID);

            return Created($"/api/tickets/{created.RequestID}", ToDto(created));
        }

        // POST: api/tickets
        // Requestor submits a facility issue WITH an optional photo (multipart/form-data)
        [HttpPost]
        [Consumes("multipart/form-data")]
        [Authorize(Roles = Roles.Requester)]
        public async Task<ActionResult<TicketDto>> CreateTicketWithPhoto([FromForm] CreateTicketWithPhotoDto dto)
        {
            var userId = User.GetRequiredUserId();

            var departmentExists = await _context.Departments.AnyAsync(d => d.DepartmentID == dto.DepartmentID);
            if (!departmentExists)
            {
                return BadRequest("Invalid department.");
            }

            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Description) || string.IsNullOrWhiteSpace(dto.Location))
            {
                return BadRequest("Title, Description, and Location are required.");
            }

            var request = new FacilityRequest
            {
                Title = dto.Title.Trim(),
                Description = dto.Description.Trim(),
                Location = dto.Location.Trim(),
                DepartmentID = dto.DepartmentID,
                RequesterID = userId,
                Status = TicketStatuses.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.FacilityRequests.Add(request);
            await _context.SaveChangesAsync();

            // Optional: Save photo
            if (dto.Photo != null && dto.Photo.Length > 0)
            {
                const long maxBytes = 5 * 1024 * 1024; // 5MB
                if (dto.Photo.Length > maxBytes)
                {
                    return BadRequest("Photo must be 5MB or smaller.");
                }

                var contentType = (dto.Photo.ContentType ?? string.Empty).Trim().ToLowerInvariant();
                var allowedTypes = new HashSet<string>
                {
                    "image/jpeg",
                    "image/png",
                    "image/gif",
                    "image/webp"
                };
                if (!allowedTypes.Contains(contentType))
                {
                    return BadRequest("Only JPG, PNG, GIF, or WEBP images are allowed.");
                }

                var ext = Path.GetExtension(dto.Photo.FileName)?.ToLowerInvariant();
                var allowedExt = new HashSet<string> { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                if (string.IsNullOrWhiteSpace(ext) || !allowedExt.Contains(ext))
                {
                    // Default by content-type
                    ext = contentType switch
                    {
                        "image/png" => ".png",
                        "image/gif" => ".gif",
                        "image/webp" => ".webp",
                        _ => ".jpg"
                    };
                }

                var ticketsDir = Path.Combine(_environment.ContentRootPath, "Uploads", "tickets");
                Directory.CreateDirectory(ticketsDir);

                var fileName = $"ticket_{request.RequestID}_{Guid.NewGuid():N}{ext}";
                var physicalPath = Path.Combine(ticketsDir, fileName);

                await using (var stream = System.IO.File.Create(physicalPath))
                {
                    await dto.Photo.CopyToAsync(stream);
                }

                // Public URL (served by Program.cs static files mapping)
                request.IssueImageUrl = $"/api/uploads/tickets/{fileName}";
                await _context.SaveChangesAsync();
            }

            _context.RequestLogs.Add(new RequestLog
            {
                RequestID = request.RequestID,
                ChangedByUserID = userId,
                OldStatus = null,
                NewStatus = TicketStatuses.Pending,
                Comments = "Ticket created"
            });
            await _context.SaveChangesAsync();

            var targetDept = await _context.Departments
                .Include(d => d.DepartmentHead)
                .FirstOrDefaultAsync(d => d.DepartmentID == request.DepartmentID);

            var headEmail = targetDept?.DepartmentHead?.Email ?? "admin@ptut.edu.pk";
            _notificationHelper.SendNewRequestAlert(request, headEmail);

            var created = await _context.FacilityRequests
                .AsNoTracking()
                .Include(r => r.Department)
                .Include(r => r.AssignedVendor)
                .FirstAsync(r => r.RequestID == request.RequestID);

            return Created($"/api/tickets/{created.RequestID}", ToDto(created));
        }

        // GET: api/tickets/department/{departmentId}
        [HttpGet("department/{departmentId:int}")]
        [Authorize(Roles = Roles.DeptHead)]
        public async Task<ActionResult<IEnumerable<TicketDto>>> GetDepartmentTickets(int departmentId, [FromQuery] string? status)
        {
            var userId = User.GetRequiredUserId();
            var myDeptId = User.GetDepartmentId();
            if (!myDeptId.HasValue)
            {
                myDeptId = await _context.Users
                    .AsNoTracking()
                    .Where(u => u.UserID == userId)
                    .Select(u => u.DepartmentID)
                    .FirstOrDefaultAsync();
            }

            if (!myDeptId.HasValue)
            {
                return Forbid();
            }

            if (departmentId != myDeptId.Value)
            {
                return Forbid();
            }

            var normalizedStatus = string.IsNullOrWhiteSpace(status) ? null : status.Trim();
            if (normalizedStatus != null && !TicketStatuses.IsValid(normalizedStatus))
            {
                return BadRequest("Invalid status filter.");
            }

            var query = _context.FacilityRequests
                .AsNoTracking()
                .Include(r => r.Department)
                .Include(r => r.AssignedVendor)
                .Where(r => r.DepartmentID == departmentId);

            if (!string.IsNullOrWhiteSpace(normalizedStatus))
            {
                query = query.Where(r => r.Status == normalizedStatus);
            }

            var tickets = await query
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => ToDto(r))
                .ToListAsync();

            return tickets;
        }

        // PUT: api/tickets/{id}/status
        // DeptHead approves/rejects incoming requests
        [HttpPut("{id:int}/status")]
        [Authorize(Roles = Roles.DeptHead)]
        public async Task<IActionResult> UpdateTicketStatus(int id, UpdateTicketStatusDto dto)
        {
            var userId = User.GetRequiredUserId();
            var myDeptId = User.GetDepartmentId();

            if (!myDeptId.HasValue)
            {
                myDeptId = await _context.Users
                    .AsNoTracking()
                    .Where(u => u.UserID == userId)
                    .Select(u => u.DepartmentID)
                    .FirstOrDefaultAsync();
            }

            if (!myDeptId.HasValue)
            {
                return Forbid();
            }

            var newStatus = dto.Status?.Trim();
            if (newStatus is not (TicketStatuses.Approved or TicketStatuses.Rejected))
            {
                return BadRequest("Department Head may only set status to Approved or Rejected.");
            }

            var request = await _context.FacilityRequests.FirstOrDefaultAsync(r => r.RequestID == id);
            if (request == null)
            {
                return NotFound();
            }
            if (request.DepartmentID != myDeptId.Value)
            {
                return Forbid();
            }
            if (request.Status != TicketStatuses.Pending)
            {
                return BadRequest("Only Pending tickets can be approved/rejected.");
            }

            var oldStatus = request.Status;
            request.Status = newStatus;

            _context.RequestLogs.Add(new RequestLog
            {
                RequestID = request.RequestID,
                ChangedByUserID = userId,
                OldStatus = oldStatus,
                NewStatus = newStatus,
                Comments = string.IsNullOrWhiteSpace(dto.Comments) ? null : dto.Comments.Trim()
            });

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PUT: api/tickets/{id}/assign-vendor
        // Admin assigns to Vendor and moves to In Progress
        [HttpPut("{id:int}/assign-vendor")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> AssignVendor(int id, AssignVendorDto dto)
        {
            var userId = User.GetRequiredUserId();

            var request = await _context.FacilityRequests.FirstOrDefaultAsync(r => r.RequestID == id);
            if (request == null)
            {
                return NotFound();
            }

            if (request.Status != TicketStatuses.Approved)
            {
                return BadRequest("Only Approved tickets can be dispatched.");
            }

            var vendorExists = await _context.Vendors.AnyAsync(v => v.VendorID == dto.VendorID);
            if (!vendorExists)
            {
                return BadRequest("Invalid vendor.");
            }

            var oldStatus = request.Status;
            request.AssignedVendorID = dto.VendorID;
            request.Status = TicketStatuses.InProgress;

            _context.RequestLogs.Add(new RequestLog
            {
                RequestID = request.RequestID,
                ChangedByUserID = userId,
                OldStatus = oldStatus,
                NewStatus = TicketStatuses.InProgress,
                Comments = $"Assigned vendor {dto.VendorID}"
            });

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // GET: api/tickets/my-assigned
        // Vendor sees tasks assigned to them
        [HttpGet("my-assigned")]
        [Authorize(Roles = Roles.Vendor)]
        public async Task<ActionResult<IEnumerable<TicketDto>>> GetMyAssignedTickets()
        {
            var userId = User.GetRequiredUserId();
            var vendorId = User.GetVendorId();
            if (!vendorId.HasValue)
            {
                vendorId = await _context.Users
                    .AsNoTracking()
                    .Where(u => u.UserID == userId)
                    .Select(u => u.VendorID)
                    .FirstOrDefaultAsync();
            }
            if (!vendorId.HasValue)
            {
                return Forbid();
            }

            var tickets = await _context.FacilityRequests
                .AsNoTracking()
                .Include(r => r.Department)
                .Include(r => r.AssignedVendor)
                .Where(r => r.AssignedVendorID == vendorId.Value)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => ToDto(r))
                .ToListAsync();

            return tickets;
        }

        // PUT: api/tickets/{id}/complete
        // Vendor marks the ticket Completed and adds resolution notes
        [HttpPut("{id:int}/complete")]
        [Authorize(Roles = Roles.Vendor)]
        public async Task<IActionResult> CompleteTicket(int id, CompleteTicketDto dto)
        {
            var userId = User.GetRequiredUserId();
            var vendorId = User.GetVendorId();
            if (!vendorId.HasValue)
            {
                vendorId = await _context.Users
                    .AsNoTracking()
                    .Where(u => u.UserID == userId)
                    .Select(u => u.VendorID)
                    .FirstOrDefaultAsync();
            }
            if (!vendorId.HasValue)
            {
                return Forbid();
            }

            var request = await _context.FacilityRequests.FirstOrDefaultAsync(r => r.RequestID == id);
            if (request == null)
            {
                return NotFound();
            }
            if (request.AssignedVendorID != vendorId.Value)
            {
                return Forbid();
            }
            if (request.Status != TicketStatuses.InProgress)
            {
                return BadRequest("Only In Progress tickets can be completed.");
            }

            var oldStatus = request.Status;
            request.Status = TicketStatuses.Completed;
            request.ResolutionNotes = dto.ResolutionNotes.Trim();
            request.CompletedAt = DateTime.UtcNow;

            _context.RequestLogs.Add(new RequestLog
            {
                RequestID = request.RequestID,
                ChangedByUserID = userId,
                OldStatus = oldStatus,
                NewStatus = TicketStatuses.Completed,
                Comments = "Vendor marked completed"
            });

            await _context.SaveChangesAsync();

            // Optional: notify requestor/admin (currently simulated)
            _notificationHelper.SendRequestCompletedAlert(request);

            return NoContent();
        }

        private static TicketDto ToDto(FacilityRequest r)
        {
            return new TicketDto
            {
                RequestID = r.RequestID,
                Title = r.Title,
                Description = r.Description,
                Location = r.Location,
                Status = r.Status,
                CreatedAt = r.CreatedAt,
                DepartmentID = r.DepartmentID,
                DepartmentName = r.Department != null ? r.Department.Name : null,
                RequesterID = r.RequesterID,
                AssignedVendorID = r.AssignedVendorID,
                AssignedVendorName = r.AssignedVendor != null ? r.AssignedVendor.CompanyName : null,
                ResolutionNotes = r.ResolutionNotes,
                CompletedAt = r.CompletedAt,
                IssueImageUrl = r.IssueImageUrl
            };
        }
    }
}
