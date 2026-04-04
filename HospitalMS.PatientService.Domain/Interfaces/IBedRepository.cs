using HospitalMS.PatientService.Domain.Entities;

namespace HospitalMS.PatientService.Domain.Interfaces;

public interface IBedRepository
{
    Task<List<Bed>> GetAllAsync();
    Task<List<Bed>> GetAvailableAsync(); // Status = 'Available'
    Task<Bed?> GetByIdAsync(int id);
    Task<Bed> AddAsync(Bed bed);
    Task UpdateAsync(Bed bed);
    Task UpdateStatusAsync(int bedId, string status);
}
