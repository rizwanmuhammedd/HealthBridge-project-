using HospitalMS.PatientService.Application.DTOs;
using HospitalMS.PatientService.Application.Interfaces;
using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;

namespace HospitalMS.PatientService.Application.Services;

public class DepartmentService : IDepartmentService
{
    private readonly IDepartmentRepository _repo;

    public DepartmentService(IDepartmentRepository repo)
    {
        _repo = repo;
    }

    public async Task<List<Department>> GetAllAsync() => await _repo.GetAllAsync();

    public async Task<Department?> GetByIdAsync(int id) => await _repo.GetByIdAsync(id);

    public async Task<Department> CreateAsync(CreateDepartmentDto dto)
    {
        var dept = new Department
        {
            Name = dto.Name,
            Description = dto.Description,
            FloorNumber = dto.FloorNumber,
            PhoneExtension = dto.PhoneExtension,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        return await _repo.AddAsync(dept);
    }

    public async Task<Department> UpdateAsync(int id, CreateDepartmentDto dto)
    {
        var dept = await _repo.GetByIdAsync(id) ?? throw new Exception("Department not found");
        dept.Name = dto.Name;
        dept.Description = dto.Description;
        dept.FloorNumber = dto.FloorNumber;
        dept.PhoneExtension = dto.PhoneExtension;
        await _repo.UpdateAsync(dept);
        return dept;
    }

    public async Task DeactivateAsync(int id)
    {
        var dept = await _repo.GetByIdAsync(id) ?? throw new Exception("Department not found");
        dept.IsActive = false;
        await _repo.UpdateAsync(dept);
    }
}
