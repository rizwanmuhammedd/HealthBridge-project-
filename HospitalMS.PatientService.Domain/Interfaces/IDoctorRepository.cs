using HospitalMS.PatientService.Domain.Entities;

namespace HospitalMS.PatientService.Domain.Interfaces;

public interface IDoctorRepository
{
    Task<List<Doctor>> GetAllAsync();
    Task<Doctor?> GetByIdAsync(int id);
    Task<List<Doctor>> GetByDepartmentAsync(int deptId);
    Task<Doctor> AddAsync(Doctor doctor);
    Task UpdateAsync(Doctor doctor);
    Task<bool> IsAvailableAsync(int doctorId, DateOnly date);
}
