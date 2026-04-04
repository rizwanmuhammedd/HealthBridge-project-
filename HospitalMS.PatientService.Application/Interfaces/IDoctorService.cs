using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Application.DTOs;

namespace HospitalMS.PatientService.Application.Interfaces;

public interface IDoctorService
{
    Task<List<Doctor>> GetAllAsync();
    Task<Doctor?> GetByIdAsync(int id);
    Task<List<Doctor>> GetByDepartmentAsync(int deptId);
    Task<Doctor> CreateAsync(CreateDoctorDto dto);
    Task UpdateAsync(Doctor doctor);
    Task DeactivateAsync(int id);
    Task ToggleAvailabilityAsync(int id);
}
