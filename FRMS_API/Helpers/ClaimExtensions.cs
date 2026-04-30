using System.Security.Claims;

namespace FRMS_API.Helpers;

public static class ClaimExtensions
{
    public static int GetRequiredUserId(this ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(raw, out var id))
        {
            return id;
        }
        throw new InvalidOperationException("Missing or invalid user id claim.");
    }

    public static int? GetDepartmentId(this ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue("departmentId");
        if (int.TryParse(raw, out var id))
        {
            return id;
        }
        return null;
    }

    public static int? GetVendorId(this ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue("vendorId");
        if (int.TryParse(raw, out var id))
        {
            return id;
        }
        return null;
    }

    public static string? GetRole(this ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.Role);
    }
}
