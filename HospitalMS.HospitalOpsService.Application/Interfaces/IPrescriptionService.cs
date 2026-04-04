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
