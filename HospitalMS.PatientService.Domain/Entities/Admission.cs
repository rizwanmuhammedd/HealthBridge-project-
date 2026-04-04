using System;
using System.Collections.Generic;

namespace HospitalMS.PatientService.Domain.Entities;

public partial class Admission
{
    public int Id { get; set; }

    public int PatientId { get; set; }

    public int DoctorId { get; set; }

    public int BedId { get; set; }

    public DateTime AdmissionDate { get; set; }

    public DateTime? DischargeDate { get; set; }

    public string Status { get; set; } = null!;

    public string? AdmissionReason { get; set; }

    public string? DischargeSummary { get; set; }

    public string? DischargeCondition { get; set; }

    public DateTime CreatedAt { get; set; }

    public int TenantId { get; set; }

    public virtual Bed Bed { get; set; } = null!;

    public virtual Doctor Doctor { get; set; } = null!;
}
