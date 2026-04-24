// HospitalMS.HospitalOpsService.Domain/Entities/Medicine.cs
using System;
using System.Collections.Generic;

namespace HospitalMS.HospitalOpsService.Domain.Entities;

public partial class Medicine
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string GenericName { get; set; } = null!;

    public string Category { get; set; } = null!;

    public string Manufacturer { get; set; } = null!;

    public int StockQuantity { get; set; }

    public int MinimumStockLevel { get; set; }

    public decimal UnitPrice { get; set; }

    public string Unit { get; set; } = null!;

    public DateOnly? ExpiryDate { get; set; }

    public string? BatchNumber { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<PrescriptionItem> PrescriptionItems { get; set; } = new List<PrescriptionItem>();
    public int TenantId { get; set; }
}
