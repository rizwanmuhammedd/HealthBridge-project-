using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using HospitalMS.HospitalOpsService.Infrastructure.GeneratedModels;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Infrastructure.Repositories;

public class PrescriptionRepository : IPrescriptionRepository
{
    private readonly HospitalOpsDbContext _db;
    public PrescriptionRepository(HospitalOpsDbContext db) => _db = db;
    
    public async Task<List<Prescription>> GetPendingAsync()
        => await _db.Prescriptions
            .Where(p => p.Status == "Pending" || p.Status == "PartiallyDispensed")
            .Include(p => p.PrescriptionItems)
            .ThenInclude(pi => pi.Medicine)
            .OrderByDescending(p => p.PrescribedAt)
            .ToListAsync();
            
    public async Task<Prescription?> GetByIdAsync(int id)
        => await _db.Prescriptions
            .Include(p => p.PrescriptionItems)
            .ThenInclude(pi => pi.Medicine) 
            .FirstOrDefaultAsync(p => p.Id == id);
            
    public async Task<List<Prescription>> GetByPatientIdAsync(int patientId)
        => await _db.Prescriptions.Where(p => p.PatientId == patientId)
            .Include(p => p.PrescriptionItems).ThenInclude(pi => pi.Medicine)
            .OrderByDescending(p => p.PrescribedAt).ToListAsync();
            
    public async Task<Prescription> AddAsync(Prescription p)
        { _db.Prescriptions.Add(p); await _db.SaveChangesAsync(); return p; }
        
    public async Task UpdateAsync(Prescription p)
        { _db.Prescriptions.Update(p); await _db.SaveChangesAsync(); }
}
