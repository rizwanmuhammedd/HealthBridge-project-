using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;
using HospitalMS.PatientService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.PatientService.Infrastructure.Repositories;

public class DepartmentRepository : IDepartmentRepository
{
    private readonly PatientDbContext _db;
    public DepartmentRepository(PatientDbContext db) => _db = db;

    public async Task<List<Department>> GetAllAsync()
        => await _db.Departments.Where(d => d.IsActive == true).ToListAsync();

    public async Task<Department?> GetByIdAsync(int id)
        => await _db.Departments.FindAsync(id);

    public async Task<bool> NameExistsAsync(string name)
        => await _db.Departments.AnyAsync(d => d.Name == name);

    public async Task<Department> AddAsync(Department dept)
    {
        _db.Departments.Add(dept);
        await _db.SaveChangesAsync();
        return dept;
    }

    public async Task UpdateAsync(Department dept)
    {
        _db.Departments.Update(dept);
        await _db.SaveChangesAsync();
    }
}
