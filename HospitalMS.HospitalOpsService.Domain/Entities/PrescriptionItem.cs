using System;
using System.Collections.Generic;

namespace HospitalMS.HospitalOpsService.Domain.Entities;
public partial class PrescriptionItem
{
    public int Id { get; set; }

    public int PrescriptionId { get; set; }

    public int MedicineId { get; set; }

    public string Dosage { get; set; } = null!;

    public string Frequency { get; set; } = null!;

    public int DurationDays { get; set; }

    public int QuantityToDispense { get; set; }

    public string? Instructions { get; set; }

    public virtual Medicine Medicine { get; set; } = null!;

    public virtual Prescription Prescription { get; set; } = null!;
    public int TenantId { get; set; }
}
