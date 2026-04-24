// HospitalMS.HospitalOpsService.Infrastructure/Repositories/PrescriptionRepository.cs
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using HospitalMS.HospitalOpsService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
namespace HospitalMS.HospitalOpsService.Infrastructure.Repositories;

public class PrescriptionRepository : IPrescriptionRepository
{
    private readonly HospitalOpsDbContext _db;
    public PrescriptionRepository(HospitalOpsDbContext db) => _db = db;

    public async Task<List<Prescription>> GetPendingAsync()
        => await _db.Prescriptions
               .Include(p => p.PrescriptionItems)
                   .ThenInclude(i => i.Medicine)
               .Where(p => p.Status == "Pending")
               .OrderBy(p => p.PrescribedAt)
               .ToListAsync();

    public async Task<Prescription?> GetByIdWithItemsAsync(int id)
        => await _db.Prescriptions
               .Include(p => p.PrescriptionItems)
                   .ThenInclude(i => i.Medicine)
               .FirstOrDefaultAsync(p => p.Id == id);

    public async Task<List<Prescription>> GetByPatientAsync(int patientId)
        => await _db.Prescriptions
               .Include(p => p.PrescriptionItems)
                   .ThenInclude(i => i.Medicine)
               .Where(p => p.PatientId == patientId)
               .OrderByDescending(p => p.PrescribedAt)
               .ToListAsync();

    public async Task<List<Prescription>> GetByDoctorAsync(int doctorId)
        => await _db.Prescriptions
               .Include(p => p.PrescriptionItems)
                   .ThenInclude(i => i.Medicine)
               .Where(p => p.DoctorId == doctorId)
               .OrderByDescending(p => p.PrescribedAt)
               .ToListAsync();

    public async Task<Prescription> AddAsync(Prescription prescription)
    {
        _db.Prescriptions.Add(prescription);
        await _db.SaveChangesAsync();
        return prescription;
    }

    public async Task UpdateAsync(Prescription prescription)
    {
        _db.Prescriptions.Update(prescription);
        await _db.SaveChangesAsync();
    }
}
