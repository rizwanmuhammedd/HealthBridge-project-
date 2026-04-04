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
