using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using HospitalMS.AuthService.Domain.Entities;
using HospitalMS.AuthService.Domain.Interfaces;

namespace HospitalMS.AuthService.Infrastructure.Data;

public partial class AuthDbContext : DbContext
{
    private readonly ITenantProvider? _tenant;

    public AuthDbContext()
    {
    }

    public AuthDbContext(DbContextOptions<AuthDbContext> options, ITenantProvider tenant)
        : base(options)
    {
        _tenant = tenant;
    }

    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<Tenant> Tenants { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            // The connection string is provided in Program.cs
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Users__3214EC07B246A652");

            entity.HasQueryFilter(e => e.TenantId == _tenant!.TenantId);

            entity.HasIndex(e => e.Email, "IX_Users_Email").IsUnique();

            entity.Property(e => e.Address).HasMaxLength(300);
            entity.Property(e => e.BloodGroup).HasMaxLength(5);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.FullName).HasMaxLength(100);
            entity.Property(e => e.Gender).HasMaxLength(10);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.Phone).HasMaxLength(15);
            entity.Property(e => e.ProfileImageUrl).HasMaxLength(300);
            entity.Property(e => e.Role).HasMaxLength(30);
            entity.Property(e => e.RefreshToken).HasMaxLength(500);
            entity.Property(e => e.PasswordResetToken).HasMaxLength(500);

            // Seed Admin User
            entity.HasData(new User
            {
                Id = 1,
                FullName = "System Administrator",
                Email = "admin@hms.com",
                PasswordHash = "$2a$11$9rW.mX.5x6mI6Y9Xm9m9Me6vX6mI6Y9Xm9m9Me6vX6mI6Y9Xm9m9M", // Password123!
                Role = "Admin",
                Phone = "1234567890",
                IsActive = true,
                CreatedAt = new DateTime(2025, 1, 1),
                TenantId = 1
            });

            // Seed Doctor User
            entity.HasData(new User
            {
                Id = 2,
                FullName = "Dr. John Smith",
                Email = "doctor@hms.com",
                PasswordHash = "$2a$11$9rW.mX.5x6mI6Y9Xm9m9Me6vX6mI6Y9Xm9m9Me6vX6mI6Y9Xm9m9M", // Password123!
                Role = "Doctor",
                Phone = "9876543210",
                IsActive = true,
                CreatedAt = new DateTime(2025, 1, 1),
                TenantId = 1
            });
        });

        OnModelCreatingPartial(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries().Where(e => e.State == EntityState.Added))
        {
            var property = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "TenantId");
            if (property != null && _tenant != null)
            {
                property.CurrentValue = _tenant.TenantId;
            }
        }
        return base.SaveChangesAsync(cancellationToken);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
