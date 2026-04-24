// HospitalMS.HospitalOpsService.Domain/Interfaces/IBillRepository.cs
using HospitalMS.HospitalOpsService.Domain.Entities;
namespace HospitalMS.HospitalOpsService.Domain.Interfaces;

public interface IBillRepository
{
    Task<List<Bill>> GetAllAsync();
    Task<Bill?> GetByIdAsync(int id);
    Task<List<Bill>> GetByPatientAsync(int patientId);
    Task<List<Bill>> GetPendingAsync();
    Task<Bill> AddAsync(Bill bill);
    Task UpdateAsync(Bill bill);
    Task<string> GenerateBillNumberAsync();
}
