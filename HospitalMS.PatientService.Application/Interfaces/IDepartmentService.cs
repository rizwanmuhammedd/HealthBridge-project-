using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Application.DTOs;

namespace HospitalMS.PatientService.Application.Interfaces;

public interface IDepartmentService
{
    Task<List<Department>> GetAllAsync();
    Task<Department?> GetByIdAsync(int id);
    Task<Department> CreateAsync(CreateDepartmentDto dto);
    Task<Department> UpdateAsync(int id, CreateDepartmentDto dto);
    Task DeactivateAsync(int id);
}
