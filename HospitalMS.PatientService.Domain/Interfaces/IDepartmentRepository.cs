using HospitalMS.PatientService.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalMS.PatientService.Domain.Interfaces;

public interface IDepartmentRepository
{
    Task<List<Department>> GetAllAsync();
    Task<Department?> GetByIdAsync(int id);
    Task<Department> AddAsync(Department department);
    Task UpdateAsync(Department department);
    Task<bool> NameExistsAsync(string name);
}
