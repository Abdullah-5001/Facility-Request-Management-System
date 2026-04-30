using FRMS_API.DB;
using FRMS_API.DTOs;
using FRMS_API.Helpers;
using FRMS_API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FRMS_API.Controllers;

[Route("api/admin")]
[ApiController]
[Authorize(Roles = Roles.Admin)]
public sealed class AdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AdminController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? role = null)
    {
        var normalizedRole = string.IsNullOrWhiteSpace(role) ? null : role.Trim();

        var query = _context.Users
            .AsNoTracking()
            .Include(u => u.Department)
            .Include(u => u.Vendor)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(normalizedRole))
        {
            query = query.Where(u => u.Role == normalizedRole);
        }

        var users = await query
            .OrderBy(u => u.FullName)
            .Select(u => new
            {
                u.UserID,
                u.FullName,
                u.Email,
                u.Role,
                u.DepartmentID,
                DepartmentName = u.Department != null ? u.Department.Name : null,
                u.VendorID,
                VendorName = u.Vendor != null ? u.Vendor.CompanyName : null
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser(CreateAdminUserDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var role = dto.Role.Trim();
        var allowedRoles = new[] { Roles.Admin, Roles.DeptHead, Roles.Vendor, Roles.Requester };
        if (!allowedRoles.Contains(role))
        {
            return BadRequest("Invalid user role.");
        }

        if (await _context.Users.AnyAsync(u => u.Email == dto.Email.Trim()))
        {
            return BadRequest("Email already in use.");
        }

        if (role == Roles.DeptHead)
        {
            if (!dto.DepartmentID.HasValue)
            {
                return BadRequest("Department is required for department heads.");
            }

            var departmentExists = await _context.Departments.AnyAsync(d => d.DepartmentID == dto.DepartmentID.Value);
            if (!departmentExists)
            {
                return BadRequest("Invalid department.");
            }
        }

        if (role == Roles.Vendor)
        {
            if (!dto.VendorID.HasValue)
            {
                return BadRequest("Vendor is required for vendor users.");
            }

            var vendorExists = await _context.Vendors.AnyAsync(v => v.VendorID == dto.VendorID.Value);
            if (!vendorExists)
            {
                return BadRequest("Invalid vendor.");
            }
        }

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = role,
            DepartmentID = dto.DepartmentID,
            VendorID = dto.VendorID
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Created($"/api/admin/users/{user.UserID}", new
        {
            user.UserID,
            user.FullName,
            user.Email,
            user.Role,
            user.DepartmentID,
            DepartmentName = user.DepartmentID.HasValue ? await _context.Departments.Where(d => d.DepartmentID == user.DepartmentID).Select(d => d.Name).FirstOrDefaultAsync() : null,
            user.VendorID,
            VendorName = user.VendorID.HasValue ? await _context.Vendors.Where(v => v.VendorID == user.VendorID).Select(v => v.CompanyName).FirstOrDefaultAsync() : null
        });
    }

    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs([FromQuery] int limit = 50)
    {
        var safeLimit = limit <= 0 ? 50 : Math.Min(limit, 200);

        var logs = await _context.RequestLogs
            .AsNoTracking()
            .Include(l => l.FacilityRequest)
                .ThenInclude(r => r.Department)
            .Include(l => l.FacilityRequest)
                .ThenInclude(r => r.AssignedVendor)
            .Include(l => l.ChangedByUser)
            .OrderByDescending(l => l.ChangedDate)
            .Take(safeLimit)
            .Select(l => new
            {
                l.LogID,
                l.RequestID,
                TicketTitle = l.FacilityRequest != null ? l.FacilityRequest.Title : null,
                DepartmentName = l.FacilityRequest != null && l.FacilityRequest.Department != null ? l.FacilityRequest.Department.Name : null,
                VendorName = l.FacilityRequest != null && l.FacilityRequest.AssignedVendor != null ? l.FacilityRequest.AssignedVendor.CompanyName : null,
                l.OldStatus,
                l.NewStatus,
                l.Comments,
                l.ChangedDate,
                ChangedByName = l.ChangedByUser != null ? l.ChangedByUser.FullName : null,
                ChangedByRole = l.ChangedByUser != null ? l.ChangedByUser.Role : null
            })
            .ToListAsync();

        return Ok(logs);
    }
}