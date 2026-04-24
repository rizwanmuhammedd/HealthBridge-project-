// HospitalMS.HospitalOpsService.Infrastructure/Repositories/BillRepository.cs
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using HospitalMS.HospitalOpsService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
namespace HospitalMS.HospitalOpsService.Infrastructure.Repositories;

public class BillRepository : IBillRepository
{
    private readonly HospitalOpsDbContext _db;
    public BillRepository(HospitalOpsDbContext db) => _db = db;

    public async Task<List<Bill>> GetAllAsync()
        => await _db.Bills.OrderByDescending(b => b.GeneratedAt).ToListAsync();

    public async Task<Bill?> GetByIdAsync(int id)
        => await _db.Bills.FindAsync(id);

    public async Task<List<Bill>> GetByPatientAsync(int patientId)
        => await _db.Bills
               .Where(b => b.PatientId == patientId)
               .OrderByDescending(b => b.GeneratedAt)
               .ToListAsync();

    public async Task<List<Bill>> GetPendingAsync()
        => await _db.Bills
               .Where(b => b.PaymentStatus != "Paid" && b.BalanceAmount > 0)
               .OrderByDescending(b => b.GeneratedAt)
               .ToListAsync();

    public async Task<Bill> AddAsync(Bill bill)
    {
        _db.Bills.Add(bill);
        await _db.SaveChangesAsync();
        return bill;
    }

    public async Task UpdateAsync(Bill bill)
    {
        _db.Bills.Update(bill);
        await _db.SaveChangesAsync();
    }

    public async Task<string> GenerateBillNumberAsync()
    {
        int count = await _db.Bills.CountAsync();
        return $"BILL-{DateTime.UtcNow.Year}-{(count + 1):D5}";
        // Output: BILL-2025-00001
    }
}
