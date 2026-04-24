using System;

namespace HospitalMS.PatientService.Application.DTOs;

public class AdmitPatientDto
{
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public string WardType { get; set; } = string.Empty; 
    public string? AdmissionReason { get; set; }
}

public class DischargePatientDto
{
    public string DischargeSummary { get; set; } = string.Empty;
    public string DischargeCondition { get; set; } = string.Empty; 
}

public class AdmissionResponseDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public string BedNumber { get; set; } = string.Empty;
    public string WardType { get; set; } = string.Empty;
    public DateTime AdmissionDate { get; set; }
    public DateTime? DischargeDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TotalDays { get; set; } 
    public decimal TotalBedCharge { get; set; } 
}

public class BedDto
{
    public int Id { get; set; }
    public string BedNumber { get; set; } = string.Empty;
    public string WardType { get; set; } = string.Empty; // ICU | General | Private
    public string Status { get; set; } = string.Empty; // Available | Occupied | UnderCleaning
}
