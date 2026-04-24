$ErrorActionPreference = 'Stop'

# 1. Domain Interfaces
$files = @{}
$files["HospitalMS.HospitalOpsService.Domain/Interfaces/IMedicineRepository.cs"] = @'
using HospitalMS.HospitalOpsService.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Domain.Interfaces;

public interface IMedicineRepository
{
    Task<List<Medicine>> GetAllAsync();
    Task<Medicine?> GetByIdAsync(int id);
    Task<List<Medicine>> GetLowStockAsync();
    Task<Medicine> AddAsync(Medicine medicine);
    Task UpdateAsync(Medicine medicine);
    Task UpdateStockAsync(int id, int newQuantity);
}
'@

$files["HospitalMS.HospitalOpsService.Domain/Interfaces/IPrescriptionRepository.cs"] = @'
using HospitalMS.HospitalOpsService.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Domain.Interfaces;

public interface IPrescriptionRepository
{
    Task<List<Prescription>> GetPendingAsync();
    Task<Prescription?> GetByIdWithItemsAsync(int id);
    Task<List<Prescription>> GetByPatientAsync(int patientId);
    Task<Prescription> AddAsync(Prescription prescription);
    Task UpdateAsync(Prescription prescription);
}
'@

$files["HospitalMS.HospitalOpsService.Domain/Interfaces/ILabOrderRepository.cs"] = @'
using HospitalMS.HospitalOpsService.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Domain.Interfaces;

public interface ILabOrderRepository
{
    Task<List<LabOrder>> GetPendingAsync();
    Task<List<LabOrder>> GetByPatientAsync(int patientId);
    Task<LabOrder?> GetByIdAsync(int id);
    Task<LabOrder> AddAsync(LabOrder order);
    Task UpdateAsync(LabOrder order);
}
'@

$files["HospitalMS.HospitalOpsService.Domain/Interfaces/IBillRepository.cs"] = @'
using HospitalMS.HospitalOpsService.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Domain.Interfaces;

public interface IBillRepository
{
    Task<List<Bill>> GetAllAsync();
    Task<Bill?> GetByIdAsync(int id);
    Task<List<Bill>> GetByPatientAsync(int patientId);
    Task<Bill> AddAsync(Bill bill);
    Task UpdateAsync(Bill bill);
    Task<string> GenerateBillNumberAsync();
}
'@

# 2. Application DTOs
$files["HospitalMS.HospitalOpsService.Application/DTOs/MedicineDtos.cs"] = @'
namespace HospitalMS.HospitalOpsService.Application.DTOs;

public class CreateMedicineDto
{
    public string Name { get; set; } = string.Empty;
    public string GenericName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
    public int MinimumStockLevel { get; set; } = 10;
    public decimal UnitPrice { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? ExpiryDate { get; set; }
    public string? BatchNumber { get; set; }
}

public class MedicineDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string GenericName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
    public int MinimumStockLevel { get; set; }
    public bool IsLowStock { get; set; }
    public decimal UnitPrice { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? ExpiryDate { get; set; }
    public string? BatchNumber { get; set; }
    public bool IsActive { get; set; }
}

public class UpdateStockDto
{
    public int NewQuantity { get; set; }
}
'@

$files["HospitalMS.HospitalOpsService.Application/DTOs/PrescriptionDtos.cs"] = @'
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
    public DateTime PrescribedAt { get; set; }
    public DateTime? DispensingAt { get; set; }
    public string? Notes { get; set; }
    public List<PrescriptionItemResponseDto> Items { get; set; } = new();
    public decimal TotalCost { get; set; }
}

public class PrescriptionItemResponseDto
{
    public int MedicineId { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public int QuantityToDispense { get; set; }
    public string? Instructions { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}
'@

$files["HospitalMS.HospitalOpsService.Application/DTOs/LabDtos.cs"] = @'
using System;

namespace HospitalMS.HospitalOpsService.Application.DTOs;

public class OrderLabTestDto
{
    public int PatientId { get; set; }
    public int LabTestId { get; set; }
    public int? AppointmentId { get; set; }
}

public class UploadResultDto
{
    public string ResultValue { get; set; } = string.Empty;
    public string? ResultNotes { get; set; }
    public bool IsAbnormal { get; set; }
}

public class LabOrderDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public int LabTestId { get; set; }
    public string TestName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ResultValue { get; set; }
    public string? ResultNotes { get; set; }
    public bool IsAbnormal { get; set; }
    public DateTime OrderedAt { get; set; }
    public DateTime? ResultUploadedAt { get; set; }
}
'@

$files["HospitalMS.HospitalOpsService.Application/DTOs/BillDtos.cs"] = @'
using System;

namespace HospitalMS.HospitalOpsService.Application.DTOs;

public class GenerateBillDto
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

public class RecordPaymentDto
{
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string? InsuranceProvider { get; set; }
    public string? InsuranceClaimNumber { get; set; }
}

public class BillDto
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
    public string? InsuranceProvider { get; set; }
    public DateTime GeneratedAt { get; set; }
    public DateTime? PaidAt { get; set; }
}
'@

# 3. Infrastructure Repositories
$files["HospitalMS.HospitalOpsService.Infrastructure/Repositories/MedicineRepository.cs"] = @'
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using HospitalMS.HospitalOpsService.Infrastructure.GeneratedModels;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Infrastructure.Repositories;

public class MedicineRepository : IMedicineRepository
{
    private readonly HospitalOpsDbContext _db;
    public MedicineRepository(HospitalOpsDbContext db) => _db = db;

    public async Task<List<Medicine>> GetAllAsync()
        => await _db.Medicines
               .Where(m => m.IsActive == true)
               .OrderBy(m => m.Name)
               .ToListAsync();

    public async Task<Medicine?> GetByIdAsync(int id)
        => await _db.Medicines.FindAsync(id);

    public async Task<List<Medicine>> GetLowStockAsync()
        => await _db.Medicines
               .Where(m => m.StockQuantity <= m.MinimumStockLevel
                        && m.IsActive == true)
               .ToListAsync();

    public async Task<Medicine> AddAsync(Medicine medicine)
    {
        _db.Medicines.Add(medicine);
        await _db.SaveChangesAsync();
        return medicine;
    }

    public async Task UpdateAsync(Medicine medicine)
    {
        _db.Medicines.Update(medicine);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateStockAsync(int id, int newQty)
    {
        var med = await _db.Medicines.FindAsync(id);
        if (med == null) return;
        med.StockQuantity = newQty;
        med.UpdatedAt     = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }
}
'@

$files["HospitalMS.HospitalOpsService.Infrastructure/Repositories/PrescriptionRepository.cs"] = @'
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using HospitalMS.HospitalOpsService.Infrastructure.GeneratedModels;
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
               .Include(p => p.PrescriptionItems)
                   .ThenInclude(i => i.Medicine)
               .Where(p => p.Status == "Pending")
               .OrderBy(p => p.PrescribedAt)
               .ToListAsync();

    public async Task<Prescription?> GetByIdWithItemsAsync(int id)
        => await _db.Prescriptions
               .Include(p => p.PrescriptionItems)
                   .ThenInclude(i => i.Medicine)
               .FirstOrDefaultAsync(p => p.Id == id);

    public async Task<List<Prescription>> GetByPatientAsync(int patientId)
        => await _db.Prescriptions
               .Include(p => p.PrescriptionItems)
                   .ThenInclude(i => i.Medicine)
               .Where(p => p.PatientId == patientId)
               .OrderByDescending(p => p.PrescribedAt)
               .ToListAsync();

    public async Task<Prescription> AddAsync(Prescription prescription)
    {
        _db.Prescriptions.Add(prescription);
        await _db.SaveChangesAsync();
        return prescription;
    }

    public async Task UpdateAsync(Prescription prescription)
    {
        _db.Prescriptions.Update(prescription);
        await _db.SaveChangesAsync();
    }
}
'@

$files["HospitalMS.HospitalOpsService.Infrastructure/Repositories/LabOrderRepository.cs"] = @'
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using HospitalMS.HospitalOpsService.Infrastructure.GeneratedModels;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Infrastructure.Repositories;

public class LabOrderRepository : ILabOrderRepository
{
    private readonly HospitalOpsDbContext _db;
    public LabOrderRepository(HospitalOpsDbContext db) => _db = db;

    public async Task<List<LabOrder>> GetPendingAsync()
        => await _db.LabOrders
               .Include(l => l.LabTest)
               .Where(l => l.Status == "Pending")
               .OrderBy(l => l.OrderedAt)
               .ToListAsync();

    public async Task<List<LabOrder>> GetByPatientAsync(int patientId)
        => await _db.LabOrders
               .Include(l => l.LabTest)
               .Where(l => l.PatientId == patientId)
               .OrderByDescending(l => l.OrderedAt)
               .ToListAsync();

    public async Task<LabOrder?> GetByIdAsync(int id)
        => await _db.LabOrders
               .Include(l => l.LabTest)
               .FirstOrDefaultAsync(l => l.Id == id);

    public async Task<LabOrder> AddAsync(LabOrder order)
    {
        _db.LabOrders.Add(order);
        await _db.SaveChangesAsync();
        return order;
    }

    public async Task UpdateAsync(LabOrder order)
    {
        _db.LabOrders.Update(order);
        await _db.SaveChangesAsync();
    }
}
'@

$files["HospitalMS.HospitalOpsService.Infrastructure/Repositories/BillRepository.cs"] = @'
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using HospitalMS.HospitalOpsService.Infrastructure.GeneratedModels;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Infrastructure.Repositories;

public class BillRepository : IBillRepository
{
    private readonly HospitalOpsDbContext _db;
    public BillRepository(HospitalOpsDbContext db) => _db = db;

    public async Task<List<Bill>> GetAllAsync()
        => await _db.Bills.OrderByDescending(b => b.GeneratedAt).ToListAsync();

    public async Task<Bill?> GetByIdAsync(int id)
        => await _db.Bills.FindAsync(id);

    public async Task<List<Bill>> GetByPatientAsync(int patientId)
        => await _db.Bills
               .Where(b => b.PatientId == patientId)
               .OrderByDescending(b => b.GeneratedAt)
               .ToListAsync();

    public async Task<Bill> AddAsync(Bill bill)
    {
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();
        return bill;
    }

    public async Task UpdateAsync(Bill bill)
    {
        _db.Bills.Update(bill);
        await _db.SaveChangesAsync();
    }

    public async Task<string> GenerateBillNumberAsync()
    {
        int count = await _db.Bills.CountAsync();
        return $"BILL-{DateTime.UtcNow.Year}-{(count + 1):D5}";
    }
}
'@

# 4. Application Services
$files["HospitalMS.HospitalOpsService.Application/Services/MedicineService.cs"] = @'
using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Application.Services;

public class MedicineService
{
    private readonly IMedicineRepository _repo;
    public MedicineService(IMedicineRepository repo) => _repo = repo;

    public async Task<List<MedicineDto>> GetAllAsync()
        => (await _repo.GetAllAsync()).Select(Map).ToList();

    public async Task<MedicineDto?> GetByIdAsync(int id)
    {
        var m = await _repo.GetByIdAsync(id);
        return m == null ? null : Map(m);
    }

    public async Task<List<MedicineDto>> GetLowStockAsync()
        => (await _repo.GetLowStockAsync()).Select(Map).ToList();

    public async Task<MedicineDto> CreateAsync(CreateMedicineDto dto)
    {
        var medicine = new Medicine
        {
            Name               = dto.Name,
            GenericName        = dto.GenericName,
            Category           = dto.Category,
            Manufacturer       = dto.Manufacturer,
            StockQuantity      = dto.StockQuantity,
            MinimumStockLevel  = dto.MinimumStockLevel,
            UnitPrice          = dto.UnitPrice,
            Unit               = dto.Unit,
            BatchNumber        = dto.BatchNumber,
            IsActive           = true,
            CreatedAt          = DateTime.UtcNow
        };

        if (!string.IsNullOrEmpty(dto.ExpiryDate))
            medicine.ExpiryDate = DateOnly.Parse(dto.ExpiryDate);

        var saved = await _repo.AddAsync(medicine);
        return Map(saved);
    }

    public async Task UpdateStockAsync(int id, int newQuantity)
    {
        if (newQuantity < 0)
            throw new Exception("Stock quantity cannot be negative");
        await _repo.UpdateStockAsync(id, newQuantity);
    }

    private static MedicineDto Map(Medicine m) => new()
    {
        Id                = m.Id,
        Name              = m.Name,
        GenericName       = m.GenericName,
        Category          = m.Category,
        Manufacturer      = m.Manufacturer,
        StockQuantity     = m.StockQuantity,
        MinimumStockLevel = m.MinimumStockLevel,
        IsLowStock        = m.StockQuantity <= m.MinimumStockLevel,
        UnitPrice         = m.UnitPrice,
        Unit              = m.Unit,
        ExpiryDate        = m.ExpiryDate?.ToString("yyyy-MM-dd"),
        BatchNumber       = m.BatchNumber,
        IsActive          = m.IsActive ?? true
    };
}
'@

$files["HospitalMS.HospitalOpsService.Application/Services/PrescriptionService.cs"] = @'
using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Application.Services;

public class PrescriptionService
{
    private readonly IPrescriptionRepository _repo;
    private readonly IMedicineRepository _medRepo;
    private readonly IHttpClientFactory _httpClientFactory;

    public PrescriptionService(IPrescriptionRepository repo,
                                IMedicineRepository medRepo,
                                IHttpClientFactory httpClientFactory)
    { _repo = repo; _medRepo = medRepo; _httpClientFactory = httpClientFactory; }

    public async Task<PrescriptionResponseDto> CreateAsync(int doctorId, CreatePrescriptionDto dto)
    {
        if (!dto.Items.Any())
            throw new Exception("Prescription must have at least one medicine");

        foreach (var item in dto.Items)
        {
            var med = await _medRepo.GetByIdAsync(item.MedicineId);
            if (med == null || med.IsActive == false)
                throw new Exception($"Medicine ID {item.MedicineId} not found or inactive");
        }

        var prescription = new Prescription
        {
            PatientId     = dto.PatientId,
            DoctorId      = doctorId,
            AppointmentId = dto.AppointmentId,
            Notes         = dto.Notes,
            Status        = "Pending",
            PrescribedAt  = DateTime.UtcNow,
            PrescriptionItems = dto.Items.Select(i => new PrescriptionItem
            {
                MedicineId         = i.MedicineId,
                Dosage             = i.Dosage,
                Frequency          = i.Frequency,
                DurationDays       = i.DurationDays,
                QuantityToDispense = i.QuantityToDispense,
                Instructions       = i.Instructions
            }).ToList()
        };

        var saved = await _repo.AddAsync(prescription);
        return await MapAsync(saved);
    }

    public async Task<PrescriptionResponseDto> DispenseAsync(int prescriptionId, int pharmacistId)
    {
        var prescription = await _repo.GetByIdWithItemsAsync(prescriptionId);
        if (prescription == null)
            throw new Exception("Prescription not found");
        if (prescription.Status == "Dispensed")
            throw new Exception("Prescription already dispensed");

        foreach (var item in prescription.PrescriptionItems)
        {
            var med = await _medRepo.GetByIdAsync(item.MedicineId);
            if (med == null)
                throw new Exception($"Medicine not found");
            if (med.StockQuantity < item.QuantityToDispense)
                throw new Exception($"Insufficient stock for {med.Name}. Available: {med.StockQuantity}, Required: {item.QuantityToDispense}");
        }

        foreach (var item in prescription.PrescriptionItems)
        {
            var med = await _medRepo.GetByIdAsync(item.MedicineId);
            int newStock = med!.StockQuantity - item.QuantityToDispense;
            await _medRepo.UpdateStockAsync(med.Id, newStock);

            if (newStock <= med.MinimumStockLevel)
            {
                await BroadcastEventAsync("Admin", "LowStockAlert", new {
                    MedicineId = med.Id, Name = med.Name,
                    CurrentStock = newStock, MinimumStock = med.MinimumStockLevel
                });
            }
        }

        prescription.Status                = "Dispensed";
        prescription.DispensingAt          = DateTime.UtcNow;
        prescription.DispensingPharmacistId = pharmacistId;
        await _repo.UpdateAsync(prescription);

        return await MapAsync(prescription);
    }

    private async Task BroadcastEventAsync(string groupName, string eventName, object payload)
    {
        try {
            var client = _httpClientFactory.CreateClient();
            var request = new { GroupName = groupName, EventName = eventName, Payload = payload };
            await client.PostAsJsonAsync("http://localhost:5004/api/notifications/broadcast", request);
        } catch { /* Silent fail for broadcast */ }
    }

    public async Task<List<PrescriptionResponseDto>> GetPendingAsync()
    {
        var list = await _repo.GetPendingAsync();
        var result = new List<PrescriptionResponseDto>();
        foreach (var p in list) result.Add(await MapAsync(p));
        return result;
    }

    public async Task<List<PrescriptionResponseDto>> GetByPatientAsync(int patientId)
    {
        var list = await _repo.GetByPatientAsync(patientId);
        var result = new List<PrescriptionResponseDto>();
        foreach (var p in list) result.Add(await MapAsync(p));
        return result;
    }

    private async Task<PrescriptionResponseDto> MapAsync(Prescription p)
    {
        var items = new List<PrescriptionItemResponseDto>();
        decimal total = 0;

        foreach (var item in p.PrescriptionItems)
        {
            var med = item.Medicine ?? await _medRepo.GetByIdAsync(item.MedicineId);
            var lineTotal = (med?.UnitPrice ?? 0) * item.QuantityToDispense;
            total += lineTotal;
            items.Add(new PrescriptionItemResponseDto
            {
                MedicineId         = item.MedicineId,
                MedicineName       = med?.Name ?? "Unknown",
                Dosage             = item.Dosage,
                Frequency          = item.Frequency,
                DurationDays       = item.DurationDays,
                QuantityToDispense = item.QuantityToDispense,
                Instructions       = item.Instructions,
                UnitPrice          = med?.UnitPrice ?? 0,
                LineTotal          = lineTotal
            });
        }

        return new PrescriptionResponseDto
        {
            Id           = p.Id,
            PatientId    = p.PatientId,
            DoctorId     = p.DoctorId,
            Status       = p.Status,
            PrescribedAt = p.PrescribedAt,
            DispensingAt = p.DispensingAt,
            Notes        = p.Notes,
            Items        = items,
            TotalCost    = total
        };
    }
}
'@

$files["HospitalMS.HospitalOpsService.Application/Services/LabService.cs"] = @'
using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Application.Services;

public class LabService
{
    private readonly ILabOrderRepository _repo;
    public LabService(ILabOrderRepository repo) => _repo = repo;

    public async Task<LabOrderDto> OrderTestAsync(int doctorId, OrderLabTestDto dto)
    {
        var order = new LabOrder
        {
            PatientId     = dto.PatientId,
            DoctorId      = doctorId,
            LabTestId     = dto.LabTestId,
            AppointmentId = dto.AppointmentId,
            Status        = "Pending",
            OrderedAt     = DateTime.UtcNow
        };

        var saved = await _repo.AddAsync(order);
        return Map(saved);
    }

    public async Task<LabOrderDto> UploadResultAsync(int orderId, UploadResultDto dto)
    {
        var order = await _repo.GetByIdAsync(orderId);
        if (order == null) throw new Exception("Lab order not found");
        if (order.Status == "ResultReady") throw new Exception("Result already uploaded");

        order.Status             = "ResultReady";
        order.ResultValue        = dto.ResultValue;
        order.ResultNotes        = dto.ResultNotes;
        order.IsAbnormal         = dto.IsAbnormal;
        order.ResultUploadedAt   = DateTime.UtcNow;
        await _repo.UpdateAsync(order);

        return Map(order);
    }

    public async Task<List<LabOrderDto>> GetPendingAsync()
        => (await _repo.GetPendingAsync()).Select(Map).ToList();

    public async Task<List<LabOrderDto>> GetByPatientAsync(int patientId)
        => (await _repo.GetByPatientAsync(patientId)).Select(Map).ToList();

    private static LabOrderDto Map(LabOrder l) => new()
    {
        Id               = l.Id,
        PatientId        = l.PatientId,
        DoctorId         = l.DoctorId,
        LabTestId        = l.LabTestId,
        TestName         = l.LabTest?.TestName ?? string.Empty,
        Category         = l.LabTest?.Category ?? string.Empty,
        Price            = l.LabTest?.Price ?? 0,
        Status           = l.Status,
        ResultValue      = l.ResultValue,
        ResultNotes      = l.ResultNotes,
        IsAbnormal       = l.IsAbnormal,
        OrderedAt        = l.OrderedAt,
        ResultUploadedAt = l.ResultUploadedAt
    };
}
'@

$files["HospitalMS.HospitalOpsService.Application/Services/BillService.cs"] = @'
using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Application.Services;

public class BillService
{
    private readonly IBillRepository _repo;
    public BillService(IBillRepository repo) => _repo = repo;

    public async Task<BillDto> GenerateBillAsync(GenerateBillDto dto)
    {
        var billNumber = await _repo.GenerateBillNumberAsync();
        var total = dto.ConsultationCharge + dto.MedicineCharge + dto.LabCharge + dto.BedCharge + dto.OtherCharges - dto.Discount;

        var bill = new Bill
        {
            BillNumber         = billNumber,
            PatientId          = dto.PatientId,
            AdmissionId        = dto.AdmissionId,
            ConsultationCharge = dto.ConsultationCharge,
            MedicineCharge     = dto.MedicineCharge,
            LabCharge          = dto.LabCharge,
            BedCharge          = dto.BedCharge,
            OtherCharges       = dto.OtherCharges,
            Discount           = dto.Discount,
            TotalAmount        = total,
            PaidAmount         = 0,
            BalanceAmount      = total,
            PaymentStatus      = "Pending",
            GeneratedAt        = DateTime.UtcNow,
            GeneratedByUserId  = dto.GeneratedByUserId
        };

        var saved = await _repo.AddAsync(bill);
        return Map(saved);
    }

    public async Task<BillDto> RecordPaymentAsync(int billId, RecordPaymentDto dto)
    {
        var bill = await _repo.GetByIdAsync(billId);
        if (bill == null) throw new Exception("Bill not found");
        if (bill.PaymentStatus == "Paid") throw new Exception("Already fully paid");
        if (dto.Amount <= 0) throw new Exception("Amount must be positive");
        if (dto.Amount > bill.BalanceAmount) throw new Exception("Amount exceeds balance");

        bill.PaidAmount   += dto.Amount;
        bill.BalanceAmount = bill.TotalAmount - bill.PaidAmount;
        bill.PaymentMethod = dto.PaymentMethod;

        if (dto.PaymentMethod == "Insurance") {
            bill.InsuranceProvider = dto.InsuranceProvider;
            bill.InsuranceClaimNumber = dto.InsuranceClaimNumber;
        }

        bill.PaymentStatus = bill.BalanceAmount <= 0 ? "Paid" : "PartiallyPaid";
        if (bill.PaymentStatus == "Paid") bill.PaidAt = DateTime.UtcNow;

        await _repo.UpdateAsync(bill);
        return Map(bill);
    }

    public async Task<List<BillDto>> GetByPatientAsync(int patientId)
        => (await _repo.GetByPatientAsync(patientId)).Select(Map).ToList();

    public async Task<BillDto?> GetByIdAsync(int id)
    {
        var b = await _repo.GetByIdAsync(id);
        return b == null ? null : Map(b);
    }

    private static BillDto Map(Bill b) => new()
    {
        Id = b.Id, BillNumber = b.BillNumber, PatientId = b.PatientId,
        ConsultationCharge = b.ConsultationCharge, MedicineCharge = b.MedicineCharge,
        LabCharge = b.LabCharge, BedCharge = b.BedCharge, OtherCharges = b.OtherCharges,
        Discount = b.Discount, TotalAmount = b.TotalAmount, PaidAmount = b.PaidAmount,
        BalanceAmount = b.BalanceAmount, PaymentStatus = b.PaymentStatus,
        PaymentMethod = b.PaymentMethod, InsuranceProvider = b.InsuranceProvider,
        GeneratedAt = b.GeneratedAt, PaidAt = b.PaidAt
    };
}
'@

# 5. API Controllers
$files["HospitalMS.HospitalOpsService.API/Controllers/MedicinesController.cs"] = @'
using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.API.Controllers;

[ApiController]
[Route("api/medicines")]
[Authorize]
public class MedicinesController : ControllerBase
{
    private readonly MedicineService _svc;
    public MedicinesController(MedicineService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _svc.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var m = await _svc.GetByIdAsync(id);
        return m == null ? NotFound() : Ok(m);
    }

    [HttpGet("low-stock")]
    [Authorize(Roles = "Admin,Pharmacist")]
    public async Task<IActionResult> GetLowStock() => Ok(await _svc.GetLowStockAsync());

    [HttpPost]
    [Authorize(Roles = "Admin,Pharmacist")]
    public async Task<IActionResult> Create([FromBody] CreateMedicineDto dto)
    {
        try { return Ok(await _svc.CreateAsync(dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPatch("{id}/stock")]
    [Authorize(Roles = "Admin,Pharmacist")]
    public async Task<IActionResult> UpdateStock(int id, [FromBody] UpdateStockDto dto)
    {
        try { await _svc.UpdateStockAsync(id, dto.NewQuantity); return NoContent(); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}
'@

$files["HospitalMS.HospitalOpsService.API/Controllers/PrescriptionsController.cs"] = @'
using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Application.Services;
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
    private readonly PrescriptionService _svc;
    public PrescriptionsController(PrescriptionService svc) => _svc = svc;

    [HttpGet("pending")]
    [Authorize(Roles = "Pharmacist,Admin")]
    public async Task<IActionResult> GetPending() => Ok(await _svc.GetPendingAsync());

    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetByPatient(int patientId) => Ok(await _svc.GetByPatientAsync(patientId));

    [HttpPost]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> Create([FromBody] CreatePrescriptionDto dto)
    {
        var doctorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        try { return Ok(await _svc.CreateAsync(doctorId, dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPatch("{id}/dispense")]
    [Authorize(Roles = "Pharmacist")]
    public async Task<IActionResult> Dispense(int id)
    {
        var pharmacistId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        try { return Ok(await _svc.DispenseAsync(id, pharmacistId)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}
'@

$files["HospitalMS.HospitalOpsService.API/Controllers/LabController.cs"] = @'
using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.API.Controllers;

[ApiController]
[Route("api/lab")]
[Authorize]
public class LabController : ControllerBase
{
    private readonly LabService _svc;
    public LabController(LabService svc) => _svc = svc;

    [HttpGet("pending")]
    [Authorize(Roles = "LabTechnician,Admin")]
    public async Task<IActionResult> GetPending() => Ok(await _svc.GetPendingAsync());

    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetByPatient(int patientId) => Ok(await _svc.GetByPatientAsync(patientId));

    [HttpPost]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> Order([FromBody] OrderLabTestDto dto)
    {
        var doctorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        try { return Ok(await _svc.OrderTestAsync(doctorId, dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPatch("{id}/result")]
    [Authorize(Roles = "LabTechnician")]
    public async Task<IActionResult> UploadResult(int id, [FromBody] UploadResultDto dto)
    {
        try { return Ok(await _svc.UploadResultAsync(id, dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}
'@

$files["HospitalMS.HospitalOpsService.API/Controllers/BillsController.cs"] = @'
using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.API.Controllers;

[ApiController]
[Route("api/bills")]
[Authorize]
public class BillsController : ControllerBase
{
    private readonly BillService _svc;
    public BillsController(BillService svc) => _svc = svc;

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var b = await _svc.GetByIdAsync(id);
        return b == null ? NotFound() : Ok(b);
    }

    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetByPatient(int patientId) => Ok(await _svc.GetByPatientAsync(patientId));

    [HttpPost]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> Generate([FromBody] GenerateBillDto dto)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        dto.GeneratedByUserId = userId;
        try { return Ok(await _svc.GenerateBillAsync(dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPost("{id}/payment")]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> RecordPayment(int id, [FromBody] RecordPaymentDto dto)
    {
        try { return Ok(await _svc.RecordPaymentAsync(id, dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}
'@

# --- Write all files ---
foreach ($f in $files.Keys) {
    $dir = Split-Path $f -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    Set-Content -Path $f -Value $files[$f]
}

# 6. Update Program.cs
$progFile = "HospitalMS.HospitalOpsService.API/Program.cs"
$progContent = @'
using HospitalMS.HospitalOpsService.Application.Services;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using HospitalMS.HospitalOpsService.Infrastructure.GeneratedModels;
using HospitalMS.HospitalOpsService.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. DbContext
builder.Services.AddDbContext<HospitalOpsDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("OpsDb")));

// 2. Multi-SaaS Config
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantProvider, TenantProvider>();

// 3. Repositories
builder.Services.AddScoped<IMedicineRepository,     MedicineRepository>();
builder.Services.AddScoped<IPrescriptionRepository, PrescriptionRepository>();
builder.Services.AddScoped<ILabOrderRepository,     LabOrderRepository>();
builder.Services.AddScoped<IBillRepository,         BillRepository>();

// 4. Services
builder.Services.AddScoped<MedicineService>();
builder.Services.AddScoped<PrescriptionService>();
builder.Services.AddScoped<LabService>();
builder.Services.AddScoped<BillService>();
builder.Services.AddHttpClient();

// 5. JWT
var jwtKey = builder.Configuration["JwtSettings:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer    = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience  = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowReact");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
'@
Set-Content $progFile $progContent
