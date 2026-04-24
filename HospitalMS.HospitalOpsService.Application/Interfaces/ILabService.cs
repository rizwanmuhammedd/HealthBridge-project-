using HospitalMS.HospitalOpsService.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Application.Interfaces;

public interface ILabService
{
    Task<LabOrderDto> OrderTestAsync(int doctorId, OrderLabTestDto dto);
    Task<LabOrderDto> UploadResultAsync(int orderId, UploadResultDto dto);
    Task<List<LabOrderDto>> GetPendingAsync();
    Task<List<LabOrderDto>> GetByPatientAsync(int patientId);
}
