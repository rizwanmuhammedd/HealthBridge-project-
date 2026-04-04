using HospitalMS.HospitalOpsService.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.Domain.Interfaces;

public interface IPrescriptionRepository
{
    Task<List<Prescription>> GetPendingAsync(); 
    Task<Prescription?> GetByIdAsync(int id); 
    Task<List<Prescription>> GetByPatientIdAsync(int patientId);
    Task<Prescription> AddAsync(Prescription prescription);
    Task UpdateAsync(Prescription prescription);
}
