// HospitalMS.HospitalOpsService.Infrastructure/Repositories/MedicineRepository.cs
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using HospitalMS.HospitalOpsService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
namespace HospitalMS.HospitalOpsService.Infrastructure.Repositories;

public class MedicineRepository : IMedicineRepository
{
    private readonly HospitalOpsDbContext _db;
    public MedicineRepository(HospitalOpsDbContext db) => _db = db;

    public async Task<List<Medicine>> GetAllAsync()
        => await _db.Medicines
               .Where(m => m.IsActive == true)
               .OrderBy(m => m.Name)
               .ToListAsync();

    public async Task<Medicine?> GetByIdAsync(int id)
        => await _db.Medicines.FindAsync(id);

    public async Task<List<Medicine>> GetLowStockAsync()
        => await _db.Medicines
               .Where(m => m.StockQuantity <= m.MinimumStockLevel
                        && m.IsActive == true)
               .ToListAsync();

    public async Task<Medicine> AddAsync(Medicine medicine)
    {
        _db.Medicines.Add(medicine);
        await _db.SaveChangesAsync();
        return medicine;
    }

    public async Task UpdateAsync(Medicine medicine)
    {
        _db.Medicines.Update(medicine);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateStockAsync(int id, int newQty)
    {
        var med = await _db.Medicines.FindAsync(id);
        if (med == null) return;
        med.StockQuantity = newQty;
        med.UpdatedAt     = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }
}
