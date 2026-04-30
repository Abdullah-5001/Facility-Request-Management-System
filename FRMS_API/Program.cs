using FRMS_API.DB;
using Microsoft.EntityFrameworkCore;
using FRMS_API.Helpers; 
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using FRMS_API.Models;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options => {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register Database and Helpers
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySQL(connectionString));

builder.Services.AddScoped<NotificationHelper>();

// Configure JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey ?? "default_secret_key_if_null"))
        };
    });

// Add CORS so React app can securely fetch data
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000", "http://localhost:5173", "https://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.Migrate();

    // Seed departments (university single-tenant baseline)
    if (!context.Departments.Any())
    {
        context.Departments.AddRange(
            new FRMS_API.Models.Department { Name = "IT Department" },
            new FRMS_API.Models.Department { Name = "Estate Management" },
            new FRMS_API.Models.Department { Name = "Planning and Development" },
            new FRMS_API.Models.Department { Name = "Academic Department" },
            new FRMS_API.Models.Department { Name = "Quality (QAC) Department" },
            new FRMS_API.Models.Department { Name = "Exam Department" }
        );
        context.SaveChanges();
        Console.WriteLine("✅ Departments seeded successfully.");
    }

    // Seed staff users (Dev-only) so you can log in as Admin/Leadership/DeptHeads without manual DB inserts.
    // Controlled via appsettings.Development.json -> Seed:Enabled
    if (app.Environment.IsDevelopment())
    {
        var seedEnabled = builder.Configuration.GetValue<bool>("Seed:Enabled");
        if (seedEnabled)
        {
            var defaultPassword = builder.Configuration["Seed:DefaultPassword"];
            var resetPasswords = builder.Configuration.GetValue<bool>("Seed:ResetPasswords");
            if (string.IsNullOrWhiteSpace(defaultPassword))
            {
                Console.WriteLine("⚠️ Seed:DefaultPassword is missing; skipping staff user seeding.");
            }
            else
            {
                static User UpsertUser(ApplicationDbContext db, string fullName, string email, string role, int? departmentId, string password, bool resetPassword)
                {
                    var existing = db.Users.FirstOrDefault(u => u.Email == email);
                    if (existing == null)
                    {
                        var user = new User
                        {
                            FullName = fullName,
                            Email = email,
                            Role = role,
                            DepartmentID = departmentId,
                            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password)
                        };
                        db.Users.Add(user);
                        db.SaveChanges();
                        return user;
                    }

                    bool changed = false;
                    if (existing.FullName != fullName) { existing.FullName = fullName; changed = true; }
                    if (existing.Role != role) { existing.Role = role; changed = true; }
                    if (existing.DepartmentID != departmentId) { existing.DepartmentID = departmentId; changed = true; }
                    if (resetPassword)
                    {
                        existing.PasswordHash = BCrypt.Net.BCrypt.HashPassword(password);
                        changed = true;
                    }
                    if (changed)
                    {
                        db.SaveChanges();
                    }
                    return existing;
                }

                // Admin
                var adminEmail = builder.Configuration["Seed:Admin:Email"];
                var adminName = builder.Configuration["Seed:Admin:FullName"] ?? "System Admin";
                if (!string.IsNullOrWhiteSpace(adminEmail))
                {
                    UpsertUser(context, adminName, adminEmail, "Admin", null, defaultPassword, resetPasswords);
                }

                // Leadership (used in CC notifications)
                var deanEmail = builder.Configuration["Seed:Leadership:Dean:Email"];
                var deanName = builder.Configuration["Seed:Leadership:Dean:FullName"] ?? "Dean";
                if (!string.IsNullOrWhiteSpace(deanEmail))
                {
                    UpsertUser(context, deanName, deanEmail, "Dean", null, defaultPassword, resetPasswords);
                }

                var vcEmail = builder.Configuration["Seed:Leadership:Vc:Email"];
                var vcName = builder.Configuration["Seed:Leadership:Vc:FullName"] ?? "Vice Chancellor";
                if (!string.IsNullOrWhiteSpace(vcEmail))
                {
                    UpsertUser(context, vcName, vcEmail, "VC", null, defaultPassword, resetPasswords);
                }

                var deputyRegistrarEmail = builder.Configuration["Seed:Leadership:DeputyRegistrar:Email"];
                var deputyRegistrarName = builder.Configuration["Seed:Leadership:DeputyRegistrar:FullName"] ?? "Deputy Registrar";
                if (!string.IsNullOrWhiteSpace(deputyRegistrarEmail))
                {
                    UpsertUser(context, deputyRegistrarName, deputyRegistrarEmail, "DeputyRegistrar", null, defaultPassword, resetPasswords);
                }

                // Department Heads: configured list
                var deptHeadConfigs = builder.Configuration.GetSection("Seed:DepartmentHeads").Get<SeedDepartmentHead[]>() ?? Array.Empty<SeedDepartmentHead>();
                foreach (var head in deptHeadConfigs)
                {
                    if (string.IsNullOrWhiteSpace(head.DepartmentName) || string.IsNullOrWhiteSpace(head.Email) || string.IsNullOrWhiteSpace(head.FullName))
                        continue;

                    var dept = context.Departments.FirstOrDefault(d => d.Name == head.DepartmentName);
                    if (dept == null) continue;

                    var user = UpsertUser(context, head.FullName, head.Email, "DeptHead", dept.DepartmentID, defaultPassword, resetPasswords);
                    if (dept.HeadUserID != user.UserID)
                    {
                        dept.HeadUserID = user.UserID;
                        context.SaveChanges();
                    }
                }

                Console.WriteLine("✅ Staff users seeded/updated (development).");
            }
        }
    }
}

// Enable Swagger UI 
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp");      // CORS must come BEFORE HttpsRedirection

// Serve uploaded issue images (physical folder: ./Uploads)
var uploadsRoot = Path.Combine(app.Environment.ContentRootPath, "Uploads");
Directory.CreateDirectory(uploadsRoot);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsRoot),
    RequestPath = "/api/uploads"
});

app.UseHttpsRedirection();

app.UseAuthentication(); 
app.UseAuthorization();

app.MapControllers();
app.Run();

internal sealed class SeedDepartmentHead
{
    public string DepartmentName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
