using Microsoft.EntityFrameworkCore;
using FRMS_API.Models;
using System.Linq; 

namespace FRMS_API.DB
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Vendor> Vendors { get; set; }
        public DbSet<FacilityRequest> FacilityRequests { get; set; }
        public DbSet<RequestLog> RequestLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Helpful uniqueness constraints
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Department>()
                .HasIndex(d => d.Name)
                .IsUnique();

            // Explicit relationship mapping (avoids EF creating unintended shadow FKs)
            modelBuilder.Entity<Department>()
                .HasOne(d => d.DepartmentHead)
                .WithMany()
                .HasForeignKey(d => d.HeadUserID);

            modelBuilder.Entity<User>()
                .HasOne(u => u.Department)
                .WithMany()
                .HasForeignKey(u => u.DepartmentID);

            modelBuilder.Entity<User>()
                .HasOne(u => u.Vendor)
                .WithMany()
                .HasForeignKey(u => u.VendorID);

            modelBuilder.Entity<FacilityRequest>()
                .HasOne(r => r.Department)
                .WithMany()
                .HasForeignKey(r => r.DepartmentID);

            modelBuilder.Entity<FacilityRequest>()
                .HasOne(r => r.Requester)
                .WithMany()
                .HasForeignKey(r => r.RequesterID);

            modelBuilder.Entity<FacilityRequest>()
                .HasOne(r => r.AssignedWorker)
                .WithMany()
                .HasForeignKey(r => r.AssignedWorkerID);

            modelBuilder.Entity<FacilityRequest>()
                .HasOne(r => r.AssignedVendor)
                .WithMany()
                .HasForeignKey(r => r.AssignedVendorID);

            modelBuilder.Entity<RequestLog>()
                .HasOne(l => l.FacilityRequest)
                .WithMany()
                .HasForeignKey(l => l.RequestID);

            modelBuilder.Entity<RequestLog>()
                .HasOne(l => l.ChangedByUser)
                .WithMany()
                .HasForeignKey(l => l.ChangedByUserID);

            // This disables "Cascade Delete" globally to prevent the Multiple Cascade Paths error
            foreach (var relationship in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
            {
                relationship.DeleteBehavior = DeleteBehavior.Restrict;
            }
        }
    }

    public class ApplicationDbContextFactory : Microsoft.EntityFrameworkCore.Design.IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            optionsBuilder.UseMySQL("Server=127.0.0.1;Port=3306;Database=FRMS_DB;Uid=root;Pwd=2380;AllowPublicKeyRetrieval=True;");

            return new ApplicationDbContext(optionsBuilder.Options);
        }
    }
}
