using System;
using System.Collections.Generic;

namespace HospitalMS.HospitalOpsService.Application.DTOs;

public class PrescriptionItemDto
{
    public int MedicineId { get; set; }
    public string Dosage { get; set; } = string.Empty; 
    public string Frequency { get; set; } = string.Empty; 
    public int DurationDays { get; set; } 
    public int QuantityToDispense { get; set; } 
    public string? Instructions { get; set; } 
}

public class CreatePrescriptionDto
{
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public int? AppointmentId { get; set; } 
    public string? Notes { get; set; }
    public List<PrescriptionItemDto> Items { get; set; } = new(); 
}

public class PrescriptionResponseDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime PrescribedAt { get; set; }
    public List<PrescriptionItemResponseDto> Items { get; set; } = new();
    public decimal TotalMedicineCost { get; set; } 
}

public class PrescriptionItemResponseDto
{
    public int Id { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public int QuantityToDispense { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; } 
    public string? Instructions { get; set; }
}
