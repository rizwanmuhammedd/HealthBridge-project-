// HospitalMS.HospitalOpsService.Application/Services/BillService.cs
using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Application.Interfaces;
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
namespace HospitalMS.HospitalOpsService.Application.Services;

public class BillService : IBillService
{
    private readonly IBillRepository _repo;
    private readonly IPrescriptionRepository _prescriptionRepo;

    public BillService(IBillRepository repo, IPrescriptionRepository prescriptionRepo)
    {
        _repo = repo;
        _prescriptionRepo = prescriptionRepo;
    }

    public async Task<BillDto> GenerateBillAsync(GenerateBillDto dto)
    {
        var billNumber = await _repo.GenerateBillNumberAsync();

        var total = dto.ConsultationCharge + dto.MedicineCharge +
                    dto.LabCharge + dto.BedCharge +
                    dto.OtherCharges - dto.Discount;

        var bill = new Bill
        {
            BillNumber         = billNumber,
            PatientId          = dto.PatientId,
            AdmissionId        = dto.AdmissionId,
            PrescriptionId     = dto.PrescriptionId,
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
        if (bill == null)
            throw new Exception("Bill not found");
        if (bill.PaymentStatus == "Paid")
            throw new Exception("This bill is already fully paid");
        if (dto.Amount <= 0)
            throw new Exception("Payment amount must be greater than zero");
        if (dto.Amount > bill.BalanceAmount)
            throw new Exception(
                $"Amount ({dto.Amount}) exceeds balance due ({bill.BalanceAmount})");

        bill.PaidAmount   += dto.Amount;
        bill.BalanceAmount = bill.TotalAmount - bill.PaidAmount;
        bill.PaymentMethod = dto.PaymentMethod;

        if (dto.PaymentMethod == "Insurance")
        {
            bill.InsuranceProvider    = dto.InsuranceProvider;
            bill.InsuranceClaimNumber = dto.InsuranceClaimNumber;
        }

        bill.PaymentStatus = bill.BalanceAmount <= 0
            ? "Paid" : "PartiallyPaid";

        if (bill.PaymentStatus == "Paid")
        {
            bill.PaidAt = DateTime.UtcNow;
            
            // If this bill was linked to a prescription, mark the prescription as paid
            if (bill.PrescriptionId.HasValue)
            {
                var prescription = await _prescriptionRepo.GetByIdWithItemsAsync(bill.PrescriptionId.Value);
                if (prescription != null)
                {
                    prescription.IsPaid = true;
                    await _prescriptionRepo.UpdateAsync(prescription);
                }
            }
        }

        await _repo.UpdateAsync(bill);
        return Map(bill);
    }

    public async Task<List<BillDto>> GetByPatientAsync(int patientId)
        => (await _repo.GetByPatientAsync(patientId)).Select(Map).ToList();

    public async Task<List<BillDto>> GetPendingAsync()
        => (await _repo.GetPendingAsync()).Select(Map).ToList();

    public async Task<BillDto?> GetByIdAsync(int id)
    {
        var b = await _repo.GetByIdAsync(id);
        return b == null ? null : Map(b);
    }

    private static BillDto Map(Bill b) => new()
    {
        Id                 = b.Id,
        BillNumber         = b.BillNumber,
        PatientId          = b.PatientId,
        PrescriptionId     = b.PrescriptionId,
        ConsultationCharge = b.ConsultationCharge,
        MedicineCharge     = b.MedicineCharge,
        LabCharge          = b.LabCharge,
        BedCharge          = b.BedCharge,
        OtherCharges       = b.OtherCharges,
        Discount           = b.Discount,
        TotalAmount        = b.TotalAmount,
        PaidAmount         = b.PaidAmount,
        BalanceAmount      = b.BalanceAmount,
        PaymentStatus      = b.PaymentStatus,
        PaymentMethod      = b.PaymentMethod,
        InsuranceProvider  = b.InsuranceProvider,
        GeneratedAt        = b.GeneratedAt,
        PaidAt             = b.PaidAt
    };
}
