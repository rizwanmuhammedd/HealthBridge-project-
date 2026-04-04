using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;

namespace HospitalMS.HospitalOpsService.Infrastructure.GeneratedModels;

public partial class HospitalOpsDbContext : DbContext
{
    private readonly ITenantProvider _tenant;

    public HospitalOpsDbContext()
    {
    }

    public HospitalOpsDbContext(DbContextOptions<HospitalOpsDbContext> options, ITenantProvider tenant)
        : base(options)
    {
        _tenant = tenant;
    }

    public virtual DbSet<Bill> Bills { get; set; }

    public virtual DbSet<Medicine> Medicines { get; set; }

    public virtual DbSet<Prescription> Prescriptions { get; set; }

    public virtual DbSet<PrescriptionItem> PrescriptionItems { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Bill>().HasQueryFilter(e => e.TenantId == _tenant.TenantId);
        modelBuilder.Entity<Medicine>().HasQueryFilter(e => e.TenantId == _tenant.TenantId);
        modelBuilder.Entity<Prescription>().HasQueryFilter(e => e.TenantId == _tenant.TenantId);
        modelBuilder.Entity<PrescriptionItem>().HasQueryFilter(e => e.TenantId == _tenant.TenantId);

        modelBuilder.Entity<Bill>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Bills__3214EC070B0DB671");

            entity.HasIndex(e => e.BillNumber, "IX_Bills_BillNumber").IsUnique();

            entity.Property(e => e.BalanceAmount).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.BedCharge).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.BillNumber).HasMaxLength(30);
            entity.Property(e => e.ConsultationCharge).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.Discount).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.GeneratedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.InsuranceClaimNumber).HasMaxLength(80);
            entity.Property(e => e.InsuranceProvider).HasMaxLength(100);
            entity.Property(e => e.LabCharge).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.MedicineCharge).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.OtherCharges).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.PaidAmount).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.PaymentMethod).HasMaxLength(30);
            entity.Property(e => e.PaymentStatus)
                .HasMaxLength(20)
                .HasDefaultValue("Pending");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(10, 2)");
        });

        modelBuilder.Entity<Medicine>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Medicine__3214EC07FBCA73A6");

            entity.Property(e => e.BatchNumber).HasMaxLength(50);
            entity.Property(e => e.Category).HasMaxLength(80);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.GenericName).HasMaxLength(200);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Manufacturer).HasMaxLength(150);
            entity.Property(e => e.MinimumStockLevel).HasDefaultValue(10);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Unit).HasMaxLength(30);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(10, 2)");
        });

        modelBuilder.Entity<Prescription>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Prescrip__3214EC07A26E7D11");

            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.PrescribedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Pending");
        });

        modelBuilder.Entity<PrescriptionItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Prescrip__3214EC07EB27D3AD");

            entity.Property(e => e.Dosage).HasMaxLength(50);
            entity.Property(e => e.Frequency).HasMaxLength(100);
            entity.Property(e => e.Instructions).HasMaxLength(300);

            entity.HasOne(d => d.Medicine).WithMany(p => p.PrescriptionItems)
                .HasForeignKey(d => d.MedicineId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PrescItems_Medicine");

            entity.HasOne(d => d.Prescription).WithMany(p => p.PrescriptionItems)
                .HasForeignKey(d => d.PrescriptionId)
                .HasConstraintName("FK_PrescItems_Prescription");
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
