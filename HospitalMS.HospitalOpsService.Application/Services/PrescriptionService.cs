using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Application.Interfaces;
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using System.Net.Http;
using System.Net.Http.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Application.Services;

public class PrescriptionService : IPrescriptionService
{
    private readonly IPrescriptionRepository _prescRepo;
    private readonly IMedicineRepository _medRepo;
    private readonly IHttpClientFactory _httpClientFactory;
    
    public PrescriptionService(IPrescriptionRepository prescRepo,
        IMedicineRepository medRepo, IHttpClientFactory httpClientFactory)
    { 
        _prescRepo = prescRepo; 
        _medRepo = medRepo; 
        _httpClientFactory = httpClientFactory; 
    }

    private async Task BroadcastEventAsync(string groupName, string eventName, object payload)
    {
        var client = _httpClientFactory.CreateClient();
        var request = new { GroupName = groupName, EventName = eventName, Payload = payload };
        await client.PostAsJsonAsync("http://localhost:5004/api/notifications/broadcast", request);
    }
    
    public async Task<PrescriptionResponseDto> CreateAsync(CreatePrescriptionDto dto)
    {
        var prescription = new Prescription
        {
            PatientId = dto.PatientId, DoctorId = dto.DoctorId,
            AppointmentId = dto.AppointmentId, Notes = dto.Notes,
            Status = "Pending", PrescribedAt = DateTime.UtcNow,
            PrescriptionItems = dto.Items.Select(i => new PrescriptionItem
            {
                MedicineId = i.MedicineId, Dosage = i.Dosage,
                Frequency = i.Frequency, DurationDays = i.DurationDays,
                QuantityToDispense = i.QuantityToDispense,
                Instructions = i.Instructions
            }).ToList()
        };
        var created = await _prescRepo.AddAsync(prescription);
        return MapToDto(created);
    }
    
    public async Task<PrescriptionResponseDto> DispenseAsync(int prescriptionId, int pharmacistId)
    {
        var prescription = await _prescRepo.GetByIdAsync(prescriptionId)
            ?? throw new Exception("Prescription not found.");
        if (prescription.Status == "Dispensed")
            throw new Exception("Already fully dispensed.");
            
        foreach (var item in prescription.PrescriptionItems)
        {
            var medicine = await _medRepo.GetByIdAsync(item.MedicineId)
                ?? throw new Exception("Medicine " + item.MedicineId + " not found.");
                
            if (medicine.StockQuantity < item.QuantityToDispense)
                throw new Exception(
                    "Insufficient stock for " + medicine.Name + ". " +
                    "Available: " + medicine.StockQuantity + ", Required: " + item.QuantityToDispense);
                    
            int newStock = medicine.StockQuantity - item.QuantityToDispense;
            await _medRepo.UpdateStockAsync(medicine.Id, newStock);
            
            if (newStock <= medicine.MinimumStockLevel)
            {
                await BroadcastEventAsync("Admin", "LowStockAlert", new {
                    MedicineId = medicine.Id, Name = medicine.Name,
                    CurrentStock = newStock, MinimumStock = medicine.MinimumStockLevel
                });
            }
        }
        
        prescription.Status = "Dispensed";
        prescription.DispensingAt = DateTime.UtcNow;
        prescription.DispensingPharmacistId = pharmacistId;
        await _prescRepo.UpdateAsync(prescription);
        return MapToDto(prescription);
    }
    
    public async Task<List<PrescriptionResponseDto>> GetPendingAsync()
    {
        var pending = await _prescRepo.GetPendingAsync();
        return pending.Select(MapToDto).ToList();
    }
        
    public async Task<List<PrescriptionResponseDto>> GetByPatientIdAsync(int patientId)
    {
        var presc = await _prescRepo.GetByPatientIdAsync(patientId);
        return presc.Select(MapToDto).ToList();
    }
        
    private PrescriptionResponseDto MapToDto(Prescription p)
    {
        var items = p.PrescriptionItems.Select(i => new PrescriptionItemResponseDto
        {
            Id = i.Id, MedicineName = i.Medicine?.Name ?? "Unknown",
            Dosage = i.Dosage, Frequency = i.Frequency,
            DurationDays = i.DurationDays, QuantityToDispense = i.QuantityToDispense,
            UnitPrice = i.Medicine?.UnitPrice ?? 0,
            LineTotal = i.QuantityToDispense * (i.Medicine?.UnitPrice ?? 0),
            Instructions = i.Instructions
        }).ToList();
        
        return new PrescriptionResponseDto {
            Id = p.Id, PatientId = p.PatientId, DoctorId = p.DoctorId,
            Status = p.Status, Notes = p.Notes, PrescribedAt = p.PrescribedAt,
            Items = items,
            TotalMedicineCost = items.Sum(i => i.LineTotal)
        };
    }
}
