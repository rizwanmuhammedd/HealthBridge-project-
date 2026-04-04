$ErrorActionPreference = 'Stop'

$code = @{}

$code['HospitalMS.PatientService.Domain\Interfaces\IAdmissionRepository.cs'] = @'
using HospitalMS.PatientService.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalMS.PatientService.Domain.Interfaces;

public interface IAdmissionRepository
{
    Task<List<Admission>> GetAllActiveAsync();
    Task<Admission?> GetByIdAsync(int id);
    Task<List<Admission>> GetByPatientIdAsync(int patientId);
    Task<Admission> AddAsync(Admission admission);
    Task UpdateAsync(Admission admission);
    Task<bool> IsPatientAdmittedAsync(int patientId);
}
'@

$code['HospitalMS.PatientService.Infrastructure\Repositories\AdmissionRepository.cs'] = @'
using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;
using HospitalMS.PatientService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.PatientService.Infrastructure.Repositories;

public class AdmissionRepository : IAdmissionRepository
{
    private readonly PatientDbContext _db;
    public AdmissionRepository(PatientDbContext db) => _db = db;
    public async Task<List<Admission>> GetAllActiveAsync()
        => await _db.Admissions
            .Where(a => a.Status == "Admitted")
            .Include(a => a.Bed)
            .OrderByDescending(a => a.AdmissionDate)
            .ToListAsync();
    public async Task<Admission?> GetByIdAsync(int id)
        => await _db.Admissions.Include(a => a.Bed).FirstOrDefaultAsync(a => a.Id == id);
    public async Task<List<Admission>> GetByPatientIdAsync(int patientId)
        => await _db.Admissions.Where(a => a.PatientId == patientId)
            .OrderByDescending(a => a.AdmissionDate).ToListAsync();
    public async Task<Admission> AddAsync(Admission a)
        { _db.Admissions.Add(a); await _db.SaveChangesAsync(); return a; }
    public async Task UpdateAsync(Admission a)
        { _db.Admissions.Update(a); await _db.SaveChangesAsync(); }
    public async Task<bool> IsPatientAdmittedAsync(int patientId)
        => await _db.Admissions.AnyAsync(a => a.PatientId == patientId && a.Status == "Admitted");
}
'@

$code['HospitalMS.PatientService.Application\DTOs\AdmissionDtos.cs'] = @'
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
'@

$code['HospitalMS.PatientService.Application\Interfaces\IAdmissionService.cs'] = @'
using HospitalMS.PatientService.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalMS.PatientService.Application.Interfaces;

public interface IAdmissionService
{
    Task<AdmissionResponseDto> AdmitPatientAsync(AdmitPatientDto dto);
    Task<AdmissionResponseDto> DischargePatientAsync(int admissionId, DischargePatientDto dto);
    Task<List<AdmissionResponseDto>> GetAllActiveAsync();
    Task<List<AdmissionResponseDto>> GetByPatientIdAsync(int patientId);
    Task<AdmissionResponseDto?> GetByIdAsync(int id);
}
'@

$code['HospitalMS.PatientService.Application\Services\AdmissionService.cs'] = @'
using HospitalMS.PatientService.Application.DTOs;
using HospitalMS.PatientService.Application.Interfaces;
using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;
using Microsoft.AspNetCore.SignalR;
using HospitalMS.PatientService.API.Hubs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.PatientService.Application.Services;

public class AdmissionService : IAdmissionService
{
    private readonly IAdmissionRepository _admRepo;
    private readonly IBedRepository _bedRepo;
    private readonly IHubContext<HospitalHub> _hub;
    
    public AdmissionService(IAdmissionRepository admRepo, 
        IBedRepository bedRepo, IHubContext<HospitalHub> hub)
    { _admRepo = admRepo; _bedRepo = bedRepo; _hub = hub; }
    
    public async Task<AdmissionResponseDto> AdmitPatientAsync(AdmitPatientDto dto)
    {
        if (await _admRepo.IsPatientAdmittedAsync(dto.PatientId))
            throw new Exception("Patient is already admitted.");
            
        var availableBeds = await _bedRepo.GetAvailableAsync();
        var bed = availableBeds.FirstOrDefault(b => b.WardType == dto.WardType);
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
        
        await _hub.Clients.Group("Admin")
            .SendAsync("BedStatusChanged", new {
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
        
        await _hub.Clients.Group("Admin")
            .SendAsync("BedStatusChanged", new {
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
'@

$code['HospitalMS.PatientService.API\Controllers\AdmissionsController.cs'] = @'
using HospitalMS.PatientService.Application.DTOs;
using HospitalMS.PatientService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace HospitalMS.PatientService.API.Controllers;

[ApiController]
[Route("api/admissions")]
[Authorize]
public class AdmissionsController : ControllerBase
{
    private readonly IAdmissionService _svc;
    public AdmissionsController(IAdmissionService svc) => _svc = svc;
    
    [HttpGet]
    [Authorize(Roles = "Admin,Receptionist,Doctor")]
    public async Task<IActionResult> GetActive()
        => Ok(await _svc.GetAllActiveAsync());
        
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    { 
        var r = await _svc.GetByIdAsync(id); 
        return r == null ? NotFound() : Ok(r); 
    }
    
    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetByPatient(int patientId)
        => Ok(await _svc.GetByPatientIdAsync(patientId));
        
    [HttpPost]
    [Authorize(Roles = "Doctor,Admin")]
    public async Task<IActionResult> Admit([FromBody] AdmitPatientDto dto)
    {
        try { return Ok(await _svc.AdmitPatientAsync(dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
    
    [HttpPut("{id}/discharge")]
    [Authorize(Roles = "Doctor,Admin")]
    public async Task<IActionResult> Discharge(int id, [FromBody] DischargePatientDto dto)
    {
        try { return Ok(await _svc.DischargePatientAsync(id, dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}
'@

$code['HospitalMS.HospitalOpsService.Domain\Interfaces\IPrescriptionRepository.cs'] = @'
using HospitalMS.HospitalOpsService.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Domain.Interfaces;

public interface IPrescriptionRepository
{
    Task<List<Prescription>> GetPendingAsync(); 
    Task<Prescription?> GetByIdAsync(int id); 
    Task<List<Prescription>> GetByPatientIdAsync(int patientId);
    Task<Prescription> AddAsync(Prescription prescription);
    Task UpdateAsync(Prescription prescription);
}
'@

$code['HospitalMS.HospitalOpsService.Infrastructure\Repositories\PrescriptionRepository.cs'] = @'
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using HospitalMS.HospitalOpsService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Infrastructure.Repositories;

public class PrescriptionRepository : IPrescriptionRepository
{
    private readonly HospitalOpsDbContext _db;
    public PrescriptionRepository(HospitalOpsDbContext db) => _db = db;
    
    public async Task<List<Prescription>> GetPendingAsync()
        => await _db.Prescriptions
            .Where(p => p.Status == "Pending" || p.Status == "PartiallyDispensed")
            .Include(p => p.PrescriptionItems)
            .ThenInclude(pi => pi.Medicine)
            .OrderByDescending(p => p.PrescribedAt)
            .ToListAsync();
            
    public async Task<Prescription?> GetByIdAsync(int id)
        => await _db.Prescriptions
            .Include(p => p.PrescriptionItems)
            .ThenInclude(pi => pi.Medicine) 
            .FirstOrDefaultAsync(p => p.Id == id);
            
    public async Task<List<Prescription>> GetByPatientIdAsync(int patientId)
        => await _db.Prescriptions.Where(p => p.PatientId == patientId)
            .Include(p => p.PrescriptionItems).ThenInclude(pi => pi.Medicine)
            .OrderByDescending(p => p.PrescribedAt).ToListAsync();
            
    public async Task<Prescription> AddAsync(Prescription p)
        { _db.Prescriptions.Add(p); await _db.SaveChangesAsync(); return p; }
        
    public async Task UpdateAsync(Prescription p)
        { _db.Prescriptions.Update(p); await _db.SaveChangesAsync(); }
}
'@

$code['HospitalMS.HospitalOpsService.Application\DTOs\PrescriptionDtos.cs'] = @'
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
'@

$code['HospitalMS.HospitalOpsService.Application\Interfaces\IPrescriptionService.cs'] = @'
using HospitalMS.HospitalOpsService.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Application.Interfaces;

public interface IPrescriptionService
{
    Task<PrescriptionResponseDto> CreateAsync(CreatePrescriptionDto dto);
    Task<PrescriptionResponseDto> DispenseAsync(int prescriptionId, int pharmacistId);
    Task<List<PrescriptionResponseDto>> GetPendingAsync();
    Task<List<PrescriptionResponseDto>> GetByPatientIdAsync(int patientId);
}
'@

$code['HospitalMS.HospitalOpsService.Application\Services\PrescriptionService.cs'] = @'
using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Application.Interfaces;
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using Microsoft.AspNetCore.SignalR;
using HospitalMS.HospitalOpsService.API.Hubs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Application.Services;

public class PrescriptionService : IPrescriptionService
{
    private readonly IPrescriptionRepository _prescRepo;
    private readonly IMedicineRepository _medRepo;
    private readonly IHubContext<HospitalHub> _hub;
    
    public PrescriptionService(IPrescriptionRepository prescRepo,
        IMedicineRepository medRepo, IHubContext<HospitalHub> hub)
    { _prescRepo = prescRepo; _medRepo = medRepo; _hub = hub; }
    
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
                await _hub.Clients.Group("Admin")
                    .SendAsync("LowStockAlert", new {
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
'@

$code['HospitalMS.HospitalOpsService.API\Controllers\PrescriptionsController.cs'] = @'
using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.API.Controllers;

[ApiController]
[Route("api/prescriptions")]
[Authorize]
public class PrescriptionsController : ControllerBase
{
    private readonly IPrescriptionService _svc;
    public PrescriptionsController(IPrescriptionService svc) => _svc = svc;
    
    [HttpGet("pending")]
    [Authorize(Roles = "Pharmacist,Admin")]
    public async Task<IActionResult> GetPending()
        => Ok(await _svc.GetPendingAsync());
        
    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetByPatient(int patientId)
        => Ok(await _svc.GetByPatientIdAsync(patientId));
        
    [HttpPost]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> Create([FromBody] CreatePrescriptionDto dto)
    {
        try { return Ok(await _svc.CreateAsync(dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
    
    [HttpPost("{id}/dispense")]
    [Authorize(Roles = "Pharmacist,Admin")]
    public async Task<IActionResult> Dispense(int id)
    {
        int pharmacistId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try { return Ok(await _svc.DispenseAsync(id, pharmacistId)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}
'@

$code['HospitalMS.HospitalOpsService.Application\DTOs\BillDtos.cs'] = @'
using System;

namespace HospitalMS.HospitalOpsService.Application.DTOs;

public class CreateBillDto
{
    public int PatientId { get; set; }
    public int? AdmissionId { get; set; } 
    public decimal ConsultationCharge { get; set; }
    public decimal MedicineCharge { get; set; } 
    public decimal LabCharge { get; set; } 
    public decimal BedCharge { get; set; } 
    public decimal OtherCharges { get; set; }
    public decimal Discount { get; set; }
    public int GeneratedByUserId { get; set; } 
}

public class PaymentDto
{
    public decimal Amount { get; set; } 
    public string Method { get; set; } = string.Empty; 
    public string? InsuranceProvider { get; set; }
    public string? InsuranceClaimNumber { get; set; }
}

public class BillResponseDto
{
    public int Id { get; set; }
    public string BillNumber { get; set; } = string.Empty;
    public int PatientId { get; set; }
    public decimal ConsultationCharge { get; set; }
    public decimal MedicineCharge { get; set; }
    public decimal LabCharge { get; set; }
    public decimal BedCharge { get; set; }
    public decimal OtherCharges { get; set; }
    public decimal Discount { get; set; }
    public decimal TotalAmount { get; set; } 
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; } 
    public string PaymentStatus { get; set; } = string.Empty; 
    public string? PaymentMethod { get; set; }
    public DateTime GeneratedAt { get; set; }
    public DateTime? PaidAt { get; set; }
}
'@

$code['HospitalMS.HospitalOpsService.Application\Interfaces\IBillService.cs'] = @'
using HospitalMS.HospitalOpsService.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Application.Interfaces;

public interface IBillService
{
    Task<BillResponseDto> GenerateBillAsync(CreateBillDto dto);
    Task ProcessPaymentAsync(int billId, PaymentDto dto);
    Task<List<BillResponseDto>> GetByPatientAsync(int patientId);
    Task<BillResponseDto?> GetByIdAsync(int id);
}
'@

$code['HospitalMS.HospitalOpsService.Application\Services\BillService.cs'] = @'
using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Application.Interfaces;
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Application.Services;

public class BillService : IBillService
{
    private readonly IBillRepository _repo;
    public BillService(IBillRepository repo) => _repo = repo;
    
    public async Task<BillResponseDto> GenerateBillAsync(CreateBillDto dto)
    {
        var bill = new Bill
        {
            BillNumber = await _repo.GenerateBillNumberAsync(),
            PatientId = dto.PatientId,
            AdmissionId = dto.AdmissionId,
            ConsultationCharge = dto.ConsultationCharge,
            MedicineCharge = dto.MedicineCharge,
            LabCharge = dto.LabCharge,
            BedCharge = dto.BedCharge,
            OtherCharges = dto.OtherCharges,
            Discount = dto.Discount,
            GeneratedByUserId = dto.GeneratedByUserId,
            PaymentStatus = "Pending",
            GeneratedAt = DateTime.UtcNow
        };
        
        bill.TotalAmount = bill.ConsultationCharge + bill.MedicineCharge + 
            bill.LabCharge + bill.BedCharge + 
            bill.OtherCharges - bill.Discount;
        bill.BalanceAmount = bill.TotalAmount; 
        bill.PaidAmount = 0;
        
        var created = await _repo.AddAsync(bill);
        return MapToDto(created);
    }
    
    public async Task ProcessPaymentAsync(int billId, PaymentDto dto)
    {
        var bill = await _repo.GetByIdAsync(billId)
            ?? throw new Exception("Bill not found.");
            
        bill.PaidAmount += dto.Amount;
        bill.BalanceAmount = bill.TotalAmount - bill.PaidAmount;
        bill.PaymentMethod = dto.Method;
        bill.InsuranceProvider = dto.InsuranceProvider;
        bill.InsuranceClaimNumber = dto.InsuranceClaimNumber;
        
        bill.PaymentStatus = bill.BalanceAmount <= 0 ? "Paid" : "PartiallyPaid";
        if (bill.BalanceAmount <= 0) bill.PaidAt = DateTime.UtcNow;
        
        await _repo.UpdateAsync(bill);
    }
    
    public async Task<List<BillResponseDto>> GetByPatientAsync(int patientId)
    {
        var bills = await _repo.GetByPatientIdAsync(patientId);
        return bills.Select(MapToDto).ToList();
    }
        
    public async Task<BillResponseDto?> GetByIdAsync(int id)
    { 
        var b = await _repo.GetByIdAsync(id); 
        return b == null ? null : MapToDto(b); 
    }
    
    private static BillResponseDto MapToDto(Bill b) => new BillResponseDto
    {
        Id = b.Id, BillNumber = b.BillNumber, PatientId = b.PatientId,
        ConsultationCharge = b.ConsultationCharge, MedicineCharge = b.MedicineCharge,
        LabCharge = b.LabCharge, BedCharge = b.BedCharge,
        OtherCharges = b.OtherCharges, Discount = b.Discount,
        TotalAmount = b.TotalAmount, PaidAmount = b.PaidAmount,
        BalanceAmount = b.BalanceAmount, PaymentStatus = b.PaymentStatus,
        PaymentMethod = b.PaymentMethod,
        GeneratedAt = b.GeneratedAt, PaidAt = b.PaidAt
    };
}
'@

$code['HospitalMS.HospitalOpsService.API\Controllers\BillsController.cs'] = @'
using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.API.Controllers;

[ApiController]
[Route("api/bills")]
[Authorize]
public class BillsController : ControllerBase
{
    private readonly IBillService _svc;
    public BillsController(IBillService svc) => _svc = svc;
    
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    { 
        var r = await _svc.GetByIdAsync(id); 
        return r == null ? NotFound() : Ok(r); 
    }
    
    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetByPatient(int patientId)
        => Ok(await _svc.GetByPatientAsync(patientId));
        
    [HttpPost]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> Generate([FromBody] CreateBillDto dto)
    {
        try { return Ok(await _svc.GenerateBillAsync(dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
    
    [HttpPost("{id}/payment")]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> Pay(int id, [FromBody] PaymentDto dto)
    {
        try { await _svc.ProcessPaymentAsync(id, dto); return NoContent(); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}
'@

$code['hospitalms-frontend\src\api\axiosInstance.js'] = @'
import axios from 'axios';
const api = axios.create({
  baseURL: 'http://localhost:5000', 
});
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
export default api;
'@

$code['hospitalms-frontend\src\context\AuthContext.jsx'] = @'
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosInstance';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);
  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const data = res.data;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setToken(data.token); setUser(data);
    return data; 
  };
  const logout = () => {
    localStorage.clear(); setToken(null); setUser(null);
    window.location.href = '/login';
  };
  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
'@

$code['hospitalms-frontend\src\hooks\useSignalR.js'] = @'
import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
export function useSignalR(hubUrl) {
  const [connection, setConnection] = useState(null);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem('token');
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token 
      })
      .withAutomaticReconnect() 
      .build();
    conn.start()
      .then(() => { setConnection(conn); setConnected(true); })
      .catch(err => console.error('SignalR error:', err));
    return () => { conn.stop(); };
  }, [hubUrl]);
  return { connection, connected };
}
'@

$code['hospitalms-frontend\src\App.jsx'] = @'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/auth/Login';
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import LabDashboard from './pages/lab/LabDashboard';
import BillingPage from './pages/billing/BillingPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to='/login' replace />;
  if (allowedRoles && !allowedRoles.includes(user.role))
    return <Navigate to='/login' replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/patient' element={
            <ProtectedRoute allowedRoles={['Patient']}>
              <PatientDashboard />
            </ProtectedRoute>} />
          <Route path='/doctor' element={
            <ProtectedRoute allowedRoles={['Doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>} />
          <Route path='/admin' element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </ProtectedRoute>} />
          <Route path='/pharmacy' element={
            <ProtectedRoute allowedRoles={['Pharmacist','Admin']}>
              <PharmacyDashboard />
            </ProtectedRoute>} />
          <Route path='/lab' element={
            <ProtectedRoute allowedRoles={['LabTechnician','Admin']}>
              <LabDashboard />
            </ProtectedRoute>} />
          <Route path='/billing' element={
            <ProtectedRoute allowedRoles={['Receptionist','Admin']}>
              <BillingPage />
            </ProtectedRoute>} />
          <Route path='/' element={<RoleRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to='/login' />;
  const routes = { Patient:'patient', Doctor:'doctor', Admin:'admin',
    Pharmacist:'pharmacy', LabTechnician:'lab', Receptionist:'billing' };
  return <Navigate to={`/${routes[user.role] || 'login'}`} />;
}
'@

$code['hospitalms-frontend\src\pages\auth\Login.jsx'] = @'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = await login(email, password);
      const routes = { Patient:'patient', Doctor:'doctor', Admin:'admin',
        Pharmacist:'pharmacy', LabTechnician:'lab', Receptionist:'billing' };
      navigate(`/${routes[user.role] || 'login'}`);
    } catch { setError('Invalid email or password'); }
    finally { setLoading(false); }
  };
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f5f5'}}>
      <div style={{background:'white',padding:'32px',borderRadius:'8px',width:'360px',boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
        <h2 style={{marginBottom:'24px',textAlign:'center'}}>Hospital MS — Login</h2>
        {error && <p style={{color:'red',marginBottom:'12px'}}>{error}</p>}
        <form onSubmit={handleLogin}>
          <input type='email' placeholder='Email' value={email}
            onChange={e=>setEmail(e.target.value)} required
            style={{width:'100%',padding:'10px',marginBottom:'12px',border:'1px solid #ddd',borderRadius:'4px',boxSizing:'border-box'}} />
          <input type='password' placeholder='Password' value={password}
            onChange={e=>setPassword(e.target.value)} required
            style={{width:'100%',padding:'10px',marginBottom:'16px',border:'1px solid #ddd',borderRadius:'4px',boxSizing:'border-box'}} />
          <button type='submit' disabled={loading}
            style={{width:'100%',padding:'11px',background:'#1976d2',color:'white',border:'none',borderRadius:'4px',cursor:'pointer'}}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
'@

$code['hospitalms-frontend\src\pages\pharmacy\PharmacyDashboard.jsx'] = @'
import { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { useSignalR } from '../../hooks/useSignalR';
export default function PharmacyDashboard() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { connection } = useSignalR('http://localhost:5004/hubs/hospital');
  useEffect(() => { loadPending(); }, []);
  useEffect(() => {
    if (!connection) return;
    connection.on('LowStockAlert', (data) => {
      alert(`LOW STOCK: ${data.name} — only ${data.currentStock} left!`);
    });
    return () => { connection.off('LowStockAlert'); };
  }, [connection]);
  const loadPending = async () => {
    const res = await api.get('/api/prescriptions/pending');
    setPrescriptions(res.data);
  };
  const dispense = async (id) => {
    setLoading(true);
    try {
      await api.post(`/api/prescriptions/${id}/dispense`);
      setMessage('Dispensed successfully!');
      await loadPending(); 
    } catch(e) { setMessage(e.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };
  return (
    <div style={{padding:'24px',maxWidth:'900px',margin:'0 auto'}}>
      <h2>Pharmacy Dashboard</h2>
      {message && <p style={{color:'green',marginBottom:'12px'}}>{message}</p>}
      <h3 style={{marginTop:'16px'}}>Pending Prescriptions ({prescriptions.length})</h3>
      {prescriptions.map(p => (
        <div key={p.id} style={{border:'1px solid #ddd',borderRadius:'8px',padding:'16px',marginBottom:'12px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <strong>Prescription #{p.id}</strong>
              <span style={{marginLeft:'12px',color:'#666'}}>Patient: {p.patientId}</span>
              <span style={{marginLeft:'12px',background:'#fff3cd',padding:'2px 8px',borderRadius:'4px'}}>{p.status}</span>
            </div>
            <button onClick={() => dispense(p.id)} disabled={loading}
              style={{padding:'8px 16px',background:'#2e7d32',color:'white',border:'none',borderRadius:'4px',cursor:'pointer'}}>
              Dispense All
            </button>
          </div>
          <table style={{width:'100%',marginTop:'12px',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#f5f5f5'}}>
              <th style={{padding:'8px',textAlign:'left'}}>Medicine</th>
              <th>Dosage</th><th>Frequency</th><th>Days</th><th>Qty</th><th>Cost</th>
            </tr></thead>
            <tbody>
              {p.items?.map(item => (
                <tr key={item.id} style={{borderBottom:'1px solid #eee'}}>
                  <td style={{padding:'8px'}}>{item.medicineName}</td>
                  <td style={{textAlign:'center'}}>{item.dosage}</td>
                  <td style={{textAlign:'center'}}>{item.frequency}</td>
                  <td style={{textAlign:'center'}}>{item.durationDays}</td>
                  <td style={{textAlign:'center'}}>{item.quantityToDispense}</td>
                  <td style={{textAlign:'center'}}>{item.lineTotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{marginTop:'8px',fontWeight:'bold'}}>Total: {p.totalMedicineCost}</p>
        </div>
      ))}
    </div>
  );
}
'@

$code['hospitalms-frontend\src\pages\billing\BillingPage.jsx'] = @'
import { useState } from 'react';
import api from '../../api/axiosInstance';
export default function BillingPage() {
  const [patientId, setPatientId] = useState('');
  const [bills, setBills] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [payingBillId, setPayingBillId] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [form, setForm] = useState({
    patientId:'', consultationCharge:0, medicineCharge:0,
    labCharge:0, bedCharge:0, otherCharges:0, discount:0, generatedByUserId:1
  });
  const searchPatient = async () => {
    const res = await api.get(`/api/bills/patient/${patientId}`);
    setBills(res.data);
  };
  const generateBill = async () => {
    await api.post('/api/bills', { ...form });
    setShowForm(false); searchPatient();
  };
  const processPayment = async (billId) => {
    await api.post(`/api/bills/${billId}/payment`, {
      amount: parseFloat(payAmount), method: payMethod
    });
    setPayingBillId(null); setPayAmount('');
    searchPatient(); 
  };
  const statusColor = (s) => s === 'Paid' ? '#2e7d32' : s === 'PartiallyPaid' ? '#f57c00' : '#c62828';
  return (
    <div style={{padding:'24px',maxWidth:'900px',margin:'0 auto'}}>
      <h2>Billing</h2>
      <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
        <input value={patientId} onChange={e=>setPatientId(e.target.value)}
          placeholder='Patient ID' style={{padding:'9px',border:'1px solid #ddd',borderRadius:'4px',flex:1}} />
        <button onClick={searchPatient} style={{padding:'9px 18px',background:'#1976d2',color:'white',border:'none',borderRadius:'4px'}}>Search</button>
        <button onClick={()=>setShowForm(!showForm)} style={{padding:'9px 18px',background:'#388e3c',color:'white',border:'none',borderRadius:'4px'}}>+ New Bill</button>
      </div>
      {showForm && (
        <div style={{border:'1px solid #ddd',borderRadius:'8px',padding:'20px',marginBottom:'20px'}}>
          <h3>Generate New Bill</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginTop:'12px'}}>
            {['patientId','consultationCharge','medicineCharge','labCharge','bedCharge','otherCharges','discount'].map(field => (
              <label key={field}>{field}
                <input type={field === 'patientId' ? 'text' : 'number'} value={form[field]}
                  onChange={e=>setForm({...form,[field]:field==='patientId'?e.target.value:parseFloat(e.target.value)||0})}
                  style={{display:'block',width:'100%',padding:'8px',marginTop:'4px',border:'1px solid #ddd',borderRadius:'4px',boxSizing:'border-box'}}
                />
              </label>
            ))}
          </div>
          <button onClick={generateBill} style={{marginTop:'16px',padding:'10px 24px',background:'#1976d2',color:'white',border:'none',borderRadius:'4px'}}>Generate</button>
        </div>
      )}
      {bills.map(b => (
        <div key={b.id} style={{border:'1px solid #ddd',borderRadius:'8px',padding:'16px',marginBottom:'12px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <strong>{b.billNumber}</strong>
              <span style={{marginLeft:'16px',color:statusColor(b.paymentStatus),fontWeight:'bold'}}>{b.paymentStatus}</span>
            </div>
            <div style={{textAlign:'right'}}>
              <div>Total: <strong>{b.totalAmount}</strong></div>
              <div>Paid: {b.paidAmount} | Balance: <strong style={{color:'#c62828'}}>{b.balanceAmount}</strong></div>
            </div>
          </div>
          {b.balanceAmount > 0 && (
            payingBillId === b.id ? (
              <div style={{display:'flex',gap:'8px',marginTop:'12px'}}>
                <input type='number' value={payAmount} onChange={e=>setPayAmount(e.target.value)}
                  placeholder='Amount' style={{padding:'8px',border:'1px solid #ddd',borderRadius:'4px',flex:1}} />
                <select value={payMethod} onChange={e=>setPayMethod(e.target.value)}
                  style={{padding:'8px',border:'1px solid #ddd',borderRadius:'4px'}}>
                  {['Cash','Card','UPI','Insurance','Cheque'].map(m => <option key={m}>{m}</option>)}
                </select>
                <button onClick={()=>processPayment(b.id)} style={{padding:'8px 16px',background:'#2e7d32',color:'white',border:'none',borderRadius:'4px'}}>Pay</button>
                <button onClick={()=>setPayingBillId(null)} style={{padding:'8px 12px',border:'1px solid #ddd',borderRadius:'4px'}}>Cancel</button>
              </div>
            ) : (
              <button onClick={()=>setPayingBillId(b.id)}
                style={{marginTop:'10px',padding:'8px 16px',background:'#f57c00',color:'white',border:'none',borderRadius:'4px'}}>
                Record Payment
              </button>
            )
          )}
        </div>
      ))}
    </div>
  );
}
'@

foreach ($path in $code.Keys) {
    $dir = Split-Path $path -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    Set-Content -Path $path -Value $code[$path]
}

# Update DI configurations
$patientProg = "HospitalMS.PatientService.API\Program.cs"
if (Test-Path $patientProg) {
    $content = Get-Content $patientProg -Raw
    if ($content -notmatch "IAdmissionService") {
        $content = $content -replace "builder\.Services\.AddControllers", "builder.Services.AddScoped<IAdmissionRepository, AdmissionRepository>();`nbuilder.Services.AddScoped<IAdmissionService, AdmissionService>();`nbuilder.Services.AddControllers"
        Set-Content $patientProg $content
    }
}

$opsProg = "HospitalMS.HospitalOpsService.API\Program.cs"
if (Test-Path $opsProg) {
    $content = Get-Content $opsProg -Raw
    if ($content -notmatch "IPrescriptionService") {
        $content = $content -replace "builder\.Services\.AddControllers", "builder.Services.AddScoped<IPrescriptionRepository, PrescriptionRepository>();`nbuilder.Services.AddScoped<IPrescriptionService, PrescriptionService>();`nbuilder.Services.AddScoped<IBillRepository, BillRepository>();`nbuilder.Services.AddScoped<IBillService, BillService>();`nbuilder.Services.AddControllers"
        Set-Content $opsProg $content
    }
}

# Fix Missing Usings in PatientService and OpsService controllers
$controllers = Get-ChildItem "HospitalMS.PatientService.API\Controllers\*.cs"
foreach ($c in $controllers) {
    $cContent = Get-Content $c.FullName -Raw
    if ($cContent -notmatch "using Microsoft\.AspNetCore\.Mvc;") {
        $cContent = "using Microsoft.AspNetCore.Mvc;`r`nusing Microsoft.AspNetCore.Authorization;`r`n" + $cContent
        Set-Content $c.FullName $cContent
    }
}

$opsControllers = Get-ChildItem "HospitalMS.HospitalOpsService.API\Controllers\*.cs"
foreach ($c in $opsControllers) {
    $cContent = Get-Content $c.FullName -Raw
    if ($cContent -notmatch "using Microsoft\.AspNetCore\.Mvc;") {
        $cContent = "using Microsoft.AspNetCore.Mvc;`r`nusing Microsoft.AspNetCore.Authorization;`r`n" + $cContent
        Set-Content $c.FullName $cContent
    }
}

# Synchronize JWT Keys
$authSettingsPath = "HospitalMS.AuthService.API\appsettings.json"
if (Test-Path $authSettingsPath) {
    $authSettings = Get-Content $authSettingsPath -Raw | ConvertFrom-Json
    $jwtKey = $authSettings.JwtSettings.Key

    $services = @("HospitalMS.PatientService.API", "HospitalMS.HospitalOpsService.API", "HospitalMS.NotificationService.API")
    foreach ($svc in $services) {
        $file = "$svc\appsettings.json"
        if (Test-Path $file) {
            $content = Get-Content $file -Raw | ConvertFrom-Json
            if ($content.JwtSettings) {
                $content.JwtSettings.Key = $jwtKey
                $content | ConvertTo-Json -Depth 10 | Set-Content $file
            }
        }
    }
}
