using HospitalMS.HospitalOpsService.Domain.Entities;

namespace HospitalMS.HospitalOpsService.Application.Interfaces;

public interface IMedicineService
{
    Task<List<Medicine>> GetAllAsync();
    Task<Medicine> AddAsync(Medicine medicine);
    Task UpdateStockAsync(int id, int newQty);
    Task<List<Medicine>> GetLowStockAsync();
}
