using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using HospitalMS.HospitalOpsService.Infrastructure.GeneratedModels;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.HospitalOpsService.Infrastructure.Repositories;

public class BillRepository : IBillRepository
{
    private readonly HospitalOpsDbContext _db;
    public BillRepository(HospitalOpsDbContext db) => _db = db;

    public async Task<List<Bill>> GetAllAsync() => await _db.Bills.ToListAsync();

    public async Task<Bill?> GetByIdAsync(int id) => await _db.Bills.FindAsync(id);

    public async Task<List<Bill>> GetByPatientIdAsync(int patientId)
        => await _db.Bills.Where(b => b.PatientId == patientId).ToListAsync();

    public async Task<Bill> AddAsync(Bill b)
    { 
        _db.Bills.Add(b); 
        await _db.SaveChangesAsync(); 
        return b; 
    }

    public async Task UpdateAsync(Bill b)
    { 
        _db.Bills.Update(b); 
        await _db.SaveChangesAsync(); 
    }

    public async Task<string> GenerateBillNumberAsync()
    {
        int count = await _db.Bills.CountAsync();
        return $"BILL-{DateTime.UtcNow.Year}-{(count + 1):D5}";
    }
}
