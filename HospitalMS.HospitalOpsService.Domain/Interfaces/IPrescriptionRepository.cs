// HospitalMS.HospitalOpsService.Domain/Interfaces/IPrescriptionRepository.cs
using HospitalMS.HospitalOpsService.Domain.Entities;
namespace HospitalMS.HospitalOpsService.Domain.Interfaces;

public interface IPrescriptionRepository
{
    Task<List<Prescription>> GetPendingAsync();
    Task<Prescription?> GetByIdWithItemsAsync(int id);
    Task<List<Prescription>> GetByPatientAsync(int patientId);
    Task<List<Prescription>> GetByDoctorAsync(int doctorId);
    Task<Prescription> AddAsync(Prescription prescription);
    Task UpdateAsync(Prescription prescription);
}
