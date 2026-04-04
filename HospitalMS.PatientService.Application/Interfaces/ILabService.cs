using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Application.DTOs;

namespace HospitalMS.PatientService.Application.Interfaces;

public interface ILabService
{
    Task<List<LabOrder>> GetAllAsync();
    Task<LabOrder?> GetByIdAsync(int id);
    Task<List<LabOrder>> GetPendingAsync();
    Task<List<LabOrder>> GetByPatientAsync(int patientId);
    Task<LabOrder> OrderTestAsync(int patientId, int doctorId, int labTestId, int? appointmentId);
    Task UploadResultAsync(int orderId, string resultValue, string? notes, bool isAbnormal);
}
