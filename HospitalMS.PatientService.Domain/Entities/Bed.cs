using System;
using System.Collections.Generic;

namespace HospitalMS.PatientService.Domain.Entities;

public partial class Bed
{
    public int Id { get; set; }

    public string BedNumber { get; set; } = null!;

    public string WardType { get; set; } = null!;

    public string Status { get; set; } = null!;

    public decimal DailyCharge { get; set; }

    public int FloorNumber { get; set; }

    public string? RoomNumber { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int TenantId { get; set; }

    public virtual ICollection<Admission> Admissions { get; set; } = new List<Admission>();
}
