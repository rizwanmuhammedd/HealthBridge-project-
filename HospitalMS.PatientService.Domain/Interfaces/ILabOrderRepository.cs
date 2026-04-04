using HospitalMS.PatientService.Domain.Entities;

namespace HospitalMS.PatientService.Domain.Interfaces;

public interface ILabOrderRepository
{
    Task<List<LabOrder>> GetAllAsync();
    Task<LabOrder?> GetByIdAsync(int id);
    Task<List<LabOrder>> GetByPatientIdAsync(int patientId);
    Task<List<LabOrder>> GetPendingAsync(); // Status = Pending
    Task<LabOrder> AddAsync(LabOrder labOrder);
    Task UpdateAsync(LabOrder labOrder);
}
