using HospitalMS.PatientService.Application.DTOs;
using HospitalMS.PatientService.Application.Interfaces;
using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;
using System.Net.Http;
using System.Net.Http.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.PatientService.Application.Services;

public class AdmissionService : IAdmissionService
{
    private readonly IAdmissionRepository _admRepo;
    private readonly IBedRepository _bedRepo;
    private readonly IHttpClientFactory _httpClientFactory;
    
    public AdmissionService(IAdmissionRepository admRepo, 
        IBedRepository bedRepo, IHttpClientFactory httpClientFactory)
    { 
        _admRepo = admRepo; 
        _bedRepo = bedRepo; 
        _httpClientFactory = httpClientFactory; 
    }

    private async Task BroadcastEventAsync(string groupName, string eventName, object payload)
    {
        var client = _httpClientFactory.CreateClient();
        var request = new { GroupName = groupName, EventName = eventName, Payload = payload };
        await client.PostAsJsonAsync("http://localhost:5004/api/notifications/broadcast", request);
    }
    
    public async Task<AdmissionResponseDto> AdmitPatientAsync(AdmitPatientDto dto)
    {
        if (await _admRepo.IsPatientAdmittedAsync(dto.PatientId))
            throw new Exception("Patient is already admitted.");
            
        var availableBeds = await _bedRepo.GetAvailableAsync();
        var bed = availableBeds.FirstOrDefault(b => string.Equals(b.WardType, dto.WardType, StringComparison.OrdinalIgnoreCase));
        if (bed == null)
            throw new Exception("No available bed in " + dto.WardType + " ward.");
            
        await _bedRepo.UpdateStatusAsync(bed.Id, "Occupied");
        
        var admission = new Admission
        {
            PatientId = dto.PatientId,
            DoctorId = dto.DoctorId,
            BedId = bed.Id,
            AdmissionDate = DateTime.UtcNow,
            Status = "Admitted",
            AdmissionReason = dto.AdmissionReason,
            CreatedAt = DateTime.UtcNow
        };
        var created = await _admRepo.AddAsync(admission);
        
        await BroadcastEventAsync("Admin", "BedStatusChanged", new {
            BedId = bed.Id, BedNumber = bed.BedNumber,
            WardType = bed.WardType, NewStatus = "Occupied"
        });
        return MapToDto(created, bed);
    }
    
    public async Task<AdmissionResponseDto> DischargePatientAsync(int admissionId, DischargePatientDto dto)
    {
        var admission = await _admRepo.GetByIdAsync(admissionId)
            ?? throw new Exception("Admission not found.");
            
        admission.DischargeDate = DateTime.UtcNow;
        admission.DischargeSummary = dto.DischargeSummary;
        admission.DischargeCondition = dto.DischargeCondition;
        admission.Status = "Discharged";
        await _admRepo.UpdateAsync(admission);
        
        await _bedRepo.UpdateStatusAsync(admission.BedId, "UnderCleaning");
        
        await BroadcastEventAsync("Admin", "BedStatusChanged", new {
            BedId = admission.BedId, NewStatus = "UnderCleaning"
        });
        return MapToDto(admission, admission.Bed!);
    }
    
    public async Task<List<AdmissionResponseDto>> GetAllActiveAsync()
    {
        var admissions = await _admRepo.GetAllActiveAsync();
        return admissions.Select(a => MapToDto(a, a.Bed!)).ToList();
    }
        
    public async Task<List<AdmissionResponseDto>> GetByPatientIdAsync(int patientId)
    {
        var admissions = await _admRepo.GetByPatientIdAsync(patientId);
        return admissions.Select(a => MapToDto(a, a.Bed)).ToList();
    }
        
    public async Task<AdmissionResponseDto?> GetByIdAsync(int id)
    { 
        var a = await _admRepo.GetByIdAsync(id); 
        return a == null ? null : MapToDto(a, a.Bed!); 
    }
    
    private static AdmissionResponseDto MapToDto(Admission a, Bed? bed)
    {
        int days = a.DischargeDate.HasValue 
            ? (int)(a.DischargeDate.Value - a.AdmissionDate).TotalDays + 1
            : (int)(DateTime.UtcNow - a.AdmissionDate).TotalDays + 1;
        decimal charge = days * (bed?.DailyCharge ?? 0);
        return new AdmissionResponseDto {
            Id = a.Id, PatientId = a.PatientId, DoctorId = a.DoctorId,
            BedNumber = bed?.BedNumber ?? "N/A",
            WardType = bed?.WardType ?? "N/A",
            AdmissionDate = a.AdmissionDate,
            DischargeDate = a.DischargeDate,
            Status = a.Status, TotalDays = days, TotalBedCharge = charge
        };
    }
}
