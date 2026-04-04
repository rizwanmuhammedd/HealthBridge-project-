using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;
using HospitalMS.PatientService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.PatientService.Infrastructure.Repositories;

public class DepartmentRepository : IDepartmentRepository
{
    private readonly PatientDbContext _db;
    public DepartmentRepository(PatientDbContext db) => _db = db;

    public async Task<List<Department>> GetAllAsync() => await _db.Departments.ToListAsync();

    public async Task<Department?> GetByIdAsync(int id) => await _db.Departments.FindAsync(id);

    public async Task<Department> AddAsync(Department department)
    {
        _db.Departments.Add(department);
        await _db.SaveChangesAsync();
        return department;
    }

    public async Task UpdateAsync(Department department)
    {
        _db.Departments.Update(department);
        await _db.SaveChangesAsync();
    }
}
