using FRMS_API.DB;
using FRMS_API.DTOs;
using FRMS_API.Helpers;
using FRMS_API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FRMS_API.Controllers;

[Route("api/vendors")]
[ApiController]
[Authorize(Roles = Roles.Admin)]
public sealed class VendorsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public VendorsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetVendors()
    {
        var vendors = await _context.Vendors
            .AsNoTracking()
            .OrderBy(v => v.CompanyName)
            .Select(v => new
            {
                v.VendorID,
                v.CompanyName
            })
            .ToListAsync();

        return Ok(vendors);
    }

    // POST: api/vendors
    // Admin manually inserts vendor records so vendors can be assigned tickets.
    [HttpPost]
    public async Task<IActionResult> CreateVendor(CreateVendorDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var vendor = new Vendor
        {
            CompanyName = dto.CompanyName.Trim(),
            ContactPerson = string.IsNullOrWhiteSpace(dto.ContactPerson) ? null : dto.ContactPerson.Trim(),
            PhoneNumber = string.IsNullOrWhiteSpace(dto.PhoneNumber) ? null : dto.PhoneNumber.Trim(),
            Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim(),
        };

        _context.Vendors.Add(vendor);
        await _context.SaveChangesAsync();

        return Created($"/api/vendors/{vendor.VendorID}", new
        {
            vendor.VendorID,
            vendor.CompanyName,
            vendor.ContactPerson,
            vendor.PhoneNumber,
            vendor.Email
        });
    }

    // POST: api/vendors/{vendorId}/users
    // Admin creates a vendor LOGIN user linked to an existing vendor record.
    [HttpPost("{vendorId:int}/users")]
    public async Task<IActionResult> CreateVendorUser(int vendorId, CreateVendorUserDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var vendorExists = await _context.Vendors.AnyAsync(v => v.VendorID == vendorId);
        if (!vendorExists)
        {
            return NotFound("Vendor not found.");
        }

        var normalizedEmail = dto.Email.Trim();
        if (await _context.Users.AnyAsync(u => u.Email == normalizedEmail))
        {
            return BadRequest("Email already in use.");
        }

        var user = new User
        {
            FullName = dto.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = Roles.Vendor,
            VendorID = vendorId
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Created($"/api/vendors/{vendorId}/users/{user.UserID}", new
        {
            user.UserID,
            user.FullName,
            user.Email,
            user.Role,
            user.VendorID
        });
    }
}
