using System;
using System.Collections.Generic;

namespace HospitalMS.PatientService.Domain.Entities;

public partial class LabOrder
{
    public int Id { get; set; }

    public int PatientId { get; set; }

    public int DoctorId { get; set; }

    public int LabTestId { get; set; }

    public int? AppointmentId { get; set; }

    public string Status { get; set; } = null!;

    public string? ResultValue { get; set; }

    public string? ResultNotes { get; set; }

    public bool IsAbnormal { get; set; }

    public string? ResultFileUrl { get; set; }

    public DateTime OrderedAt { get; set; }

    public DateTime? ResultUploadedAt { get; set; }

    public int TenantId { get; set; }

    public virtual LabTest LabTest { get; set; } = null!;
}
