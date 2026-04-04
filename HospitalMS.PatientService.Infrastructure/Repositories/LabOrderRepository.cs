using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;
using HospitalMS.PatientService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.PatientService.Infrastructure.Repositories;

public class LabOrderRepository : ILabOrderRepository
{
    private readonly PatientDbContext _db;
    public LabOrderRepository(PatientDbContext db) => _db = db;

    public async Task<List<LabOrder>> GetAllAsync()
        => await _db.LabOrders.Include(l => l.LabTest).ToListAsync();

    public async Task<LabOrder?> GetByIdAsync(int id)
        => await _db.LabOrders.Include(l => l.LabTest).FirstOrDefaultAsync(l => l.Id == id);

    public async Task<List<LabOrder>> GetByPatientIdAsync(int patientId)
        => await _db.LabOrders.Where(l => l.PatientId == patientId)
        .Include(l => l.LabTest).ToListAsync();

    public async Task<List<LabOrder>> GetPendingAsync()
        => await _db.LabOrders.Where(l => l.Status == "Pending")
        .Include(l => l.LabTest).ToListAsync();

    public async Task<LabOrder> AddAsync(LabOrder l)
    {
        _db.LabOrders.Add(l);
        await _db.SaveChangesAsync();
        return l;
    }

    public async Task UpdateAsync(LabOrder l)
    {
        _db.LabOrders.Update(l);
        await _db.SaveChangesAsync();
    }
}
