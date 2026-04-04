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
