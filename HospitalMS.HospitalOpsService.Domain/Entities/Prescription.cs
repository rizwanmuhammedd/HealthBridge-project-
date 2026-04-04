using System;
using System.Collections.Generic;

namespace HospitalMS.HospitalOpsService.Domain.Entities;
public partial class Prescription
{
    public int Id { get; set; }

    public int PatientId { get; set; }

    public int DoctorId { get; set; }

    public int? AppointmentId { get; set; }

    public string Status { get; set; } = null!;

    public string? Notes { get; set; }

    public DateTime PrescribedAt { get; set; }

    public DateTime? DispensingAt { get; set; }

    public int? DispensingPharmacistId { get; set; }

    public virtual ICollection<PrescriptionItem> PrescriptionItems { get; set; } = new List<PrescriptionItem>();
    public int TenantId { get; set; }
}
