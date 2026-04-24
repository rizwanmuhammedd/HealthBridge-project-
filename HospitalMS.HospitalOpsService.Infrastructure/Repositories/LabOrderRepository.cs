// HospitalMS.HospitalOpsService.Infrastructure/Repositories/LabOrderRepository.cs
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using HospitalMS.HospitalOpsService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
namespace HospitalMS.HospitalOpsService.Infrastructure.Repositories;

public class LabOrderRepository : ILabOrderRepository
{
    private readonly HospitalOpsDbContext _db;
    public LabOrderRepository(HospitalOpsDbContext db) => _db = db;

    public async Task<List<LabOrder>> GetPendingAsync()
        => await _db.LabOrders
               .Include(l => l.LabTest)
               .Where(l => l.Status == "Pending")
               .OrderBy(l => l.OrderedAt)
               .ToListAsync();

    public async Task<List<LabOrder>> GetByPatientAsync(int patientId)
        => await _db.LabOrders
               .Include(l => l.LabTest)
               .Where(l => l.PatientId == patientId)
               .OrderByDescending(l => l.OrderedAt)
               .ToListAsync();

    public async Task<LabOrder?> GetByIdAsync(int id)
        => await _db.LabOrders
               .Include(l => l.LabTest)
               .FirstOrDefaultAsync(l => l.Id == id);

    public async Task<LabOrder> AddAsync(LabOrder order)
    {
        _db.LabOrders.Add(order);
        await _db.SaveChangesAsync();
        return order;
    }

    public async Task UpdateAsync(LabOrder order)
    {
        _db.LabOrders.Update(order);
        await _db.SaveChangesAsync();
    }
}
