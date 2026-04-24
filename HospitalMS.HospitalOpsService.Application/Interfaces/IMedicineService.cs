using HospitalMS.HospitalOpsService.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Application.Interfaces;

public interface IMedicineService
{
    Task<List<MedicineDto>> GetAllAsync();
    Task<MedicineDto?> GetByIdAsync(int id);
    Task<List<MedicineDto>> GetLowStockAsync();
    Task<MedicineDto> CreateAsync(CreateMedicineDto dto);
    Task UpdateStockAsync(int id, int newQuantity);
}
