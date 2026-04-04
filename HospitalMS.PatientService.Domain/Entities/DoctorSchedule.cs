using System;
using System.Collections.Generic;

namespace HospitalMS.PatientService.Domain.Entities;

public partial class DoctorSchedule
{
    public int Id { get; set; }

    public int DoctorId { get; set; }

    public DateOnly ScheduleDate { get; set; }

    public string ShiftType { get; set; } = null!;

    public TimeOnly ShiftStart { get; set; }

    public TimeOnly ShiftEnd { get; set; }

    public bool IsLeave { get; set; }

    public string? LeaveReason { get; set; }

    public DateTime CreatedAt { get; set; }

    public int TenantId { get; set; }

    public virtual Doctor Doctor { get; set; } = null!;
}
