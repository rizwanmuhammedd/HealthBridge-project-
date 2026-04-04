using HospitalMS.PatientService.Domain.Entities;

namespace HospitalMS.PatientService.Application.Interfaces;

public interface IBedService
{
    Task<List<Bed>> GetAllAsync();
    Task<List<Bed>> GetAvailableAsync();
    Task<Bed?> GetByIdAsync(int id);
    Task UpdateStatusAsync(int bedId, string status);
}
