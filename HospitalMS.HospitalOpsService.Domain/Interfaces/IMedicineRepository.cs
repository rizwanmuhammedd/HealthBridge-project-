// HospitalMS.HospitalOpsService.Domain/Interfaces/IMedicineRepository.cs
using HospitalMS.HospitalOpsService.Domain.Entities;
namespace HospitalMS.HospitalOpsService.Domain.Interfaces;

public interface IMedicineRepository
{
    Task<List<Medicine>> GetAllAsync();
    Task<Medicine?> GetByIdAsync(int id);
    Task<List<Medicine>> GetLowStockAsync();
    Task<Medicine> AddAsync(Medicine medicine);
    Task UpdateAsync(Medicine medicine);
    Task UpdateStockAsync(int id, int newQuantity);
}
