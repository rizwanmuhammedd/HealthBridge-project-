using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using HospitalMS.HospitalOpsService.Infrastructure.GeneratedModels;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.HospitalOpsService.Infrastructure.Repositories;

public class MedicineRepository : IMedicineRepository
{
    private readonly HospitalOpsDbContext _db;
    public MedicineRepository(HospitalOpsDbContext db) => _db = db;

    public async Task<List<Medicine>> GetAllAsync()
        => await _db.Medicines.Where(m => m.IsActive == true).ToListAsync();

    public async Task<Medicine?> GetByIdAsync(int id)
        => await _db.Medicines.FindAsync(id);

    public async Task<List<Medicine>> GetLowStockAsync()
        => await _db.Medicines
        .Where(m => m.StockQuantity <= m.MinimumStockLevel && m.IsActive == true)
        .ToListAsync();

    public async Task<Medicine> AddAsync(Medicine m)
    { 
        _db.Medicines.Add(m); 
        await _db.SaveChangesAsync(); 
        return m; 
    }

    public async Task UpdateAsync(Medicine m)
    { 
        _db.Medicines.Update(m); 
        await _db.SaveChangesAsync(); 
    }

    public async Task UpdateStockAsync(int id, int newQty)
    {
        var m = await _db.Medicines.FindAsync(id)
            ?? throw new Exception("Medicine not found");
        m.StockQuantity = newQty;
        // m.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }
}
