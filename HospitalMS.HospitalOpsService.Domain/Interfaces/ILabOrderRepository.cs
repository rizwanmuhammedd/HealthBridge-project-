// HospitalMS.HospitalOpsService.Domain/Interfaces/ILabOrderRepository.cs
using HospitalMS.HospitalOpsService.Domain.Entities;
namespace HospitalMS.HospitalOpsService.Domain.Interfaces;

public interface ILabOrderRepository
{
    Task<List<LabOrder>> GetPendingAsync();
    Task<List<LabOrder>> GetByPatientAsync(int patientId);
    Task<LabOrder?> GetByIdAsync(int id);
    Task<LabOrder> AddAsync(LabOrder order);
    Task UpdateAsync(LabOrder order);
}
