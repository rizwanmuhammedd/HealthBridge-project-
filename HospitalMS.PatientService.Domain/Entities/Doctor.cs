using System;
using System.Collections.Generic;

namespace HospitalMS.PatientService.Domain.Entities;

public partial class Doctor
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int DepartmentId { get; set; }

    public string Specialization { get; set; } = null!;

    public string Qualification { get; set; } = null!;

    public string LicenseNumber { get; set; } = null!;

    public decimal ConsultationFee { get; set; }

    public int MaxPatientsPerDay { get; set; }

    public bool IsAvailable { get; set; }

    public DateTime CreatedAt { get; set; }

    public int TenantId { get; set; }

    public virtual ICollection<Admission> Admissions { get; set; } = new List<Admission>();

    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    public virtual Department Department { get; set; } = null!;

    public virtual ICollection<DoctorSchedule> DoctorSchedules { get; set; } = new List<DoctorSchedule>();
}
