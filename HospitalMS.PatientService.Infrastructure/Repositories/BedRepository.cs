using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;
using HospitalMS.PatientService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.PatientService.Infrastructure.Repositories;

public class BedRepository : IBedRepository
{
    private readonly PatientDbContext _db;
    public BedRepository(PatientDbContext db) => _db = db;

    public async Task<List<Bed>> GetAllAsync() => await _db.Beds.ToListAsync();

    public async Task<List<Bed>> GetAvailableAsync() 
        => await _db.Beds.Where(b => b.Status == "Available" && (b.IsActive != false)).ToListAsync();

    public async Task<Bed?> GetByIdAsync(int id) => await _db.Beds.FindAsync(id);

    public async Task<Bed> AddAsync(Bed bed)
    {
        _db.Beds.Add(bed);
        await _db.SaveChangesAsync();
        return bed;
    }

    public async Task UpdateAsync(Bed bed)
    {
        _db.Beds.Update(bed);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateStatusAsync(int bedId, string status)
    {
        var bed = await _db.Beds.FindAsync(bedId);
        if (bed != null)
        {
            bed.Status = status;
            await _db.SaveChangesAsync();
        }
    }
}
