using HospitalMS.HospitalOpsService.Domain.Entities;

namespace HospitalMS.HospitalOpsService.Domain.Interfaces;

public interface IBillRepository
{
    Task<List<Bill>> GetAllAsync();
    Task<Bill?> GetByIdAsync(int id);
    Task<List<Bill>> GetByPatientIdAsync(int patientId);
    Task<Bill> AddAsync(Bill bill);
    Task UpdateAsync(Bill bill);
    Task<string> GenerateBillNumberAsync(); // BILL-2025-00001
}
