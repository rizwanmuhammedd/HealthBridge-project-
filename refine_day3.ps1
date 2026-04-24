$ErrorActionPreference = 'Stop'

# 1. Update IDepartmentRepository
$files = @{}
$files["HospitalMS.PatientService.Domain/Interfaces/IDepartmentRepository.cs"] = @'
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
'@

# 2. Update IDoctorRepository
$files["HospitalMS.PatientService.Domain/Interfaces/IDoctorRepository.cs"] = @'
using HospitalMS.PatientService.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalMS.PatientService.Domain.Interfaces;

public interface IDoctorRepository
{
    Task<List<Doctor>> GetAllAsync();
    Task<Doctor?> GetByIdAsync(int id);
    Task<List<Doctor>> GetByDepartmentAsync(int deptId);
    Task<Doctor?> GetByUserIdAsync(int userId);
    Task<Doctor> AddAsync(Doctor doctor);
    Task UpdateAsync(Doctor doctor);
}
'@

# 3. Update DepartmentRepository
$files["HospitalMS.PatientService.Infrastructure/Repositories/DepartmentRepository.cs"] = @'
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
'@

# 4. Update DoctorRepository
$files["HospitalMS.PatientService.Infrastructure/Repositories/DoctorRepository.cs"] = @'
using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;
using HospitalMS.PatientService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.PatientService.Infrastructure.Repositories;

public class DoctorRepository : IDoctorRepository
{
    private readonly PatientDbContext _db;
    public DoctorRepository(PatientDbContext db) => _db = db;

    public async Task<List<Doctor>> GetAllAsync()
        => await _db.Doctors.Include(d => d.Department).ToListAsync();

    public async Task<Doctor?> GetByIdAsync(int id)
        => await _db.Doctors
               .Include(d => d.Department)
               .FirstOrDefaultAsync(d => d.Id == id);

    public async Task<List<Doctor>> GetByDepartmentAsync(int deptId)
        => await _db.Doctors
               .Include(d => d.Department)
               .Where(d => d.DepartmentId == deptId)
               .ToListAsync();

    public async Task<Doctor?> GetByUserIdAsync(int userId)
        => await _db.Doctors
               .Include(d => d.Department)
               .FirstOrDefaultAsync(d => d.UserId == userId);

    public async Task<Doctor> AddAsync(Doctor doctor)
    {
        _db.Doctors.Add(doctor);
        await _db.SaveChangesAsync();
        return doctor;
    }

    public async Task UpdateAsync(Doctor doctor)
    {
        _db.Doctors.Update(doctor);
        await _db.SaveChangesAsync();
    }
}
'@

# 5. Refine DepartmentService
$files["HospitalMS.PatientService.Application/Services/DepartmentService.cs"] = @'
using HospitalMS.PatientService.Application.DTOs;
using HospitalMS.PatientService.Application.Interfaces;
using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.PatientService.Application.Services;

public class DepartmentService : IDepartmentService
{
    private readonly IDepartmentRepository _repo;
    public DepartmentService(IDepartmentRepository repo) => _repo = repo;

    public async Task<List<Department>> GetAllAsync() => await _repo.GetAllAsync();

    public async Task<Department?> GetByIdAsync(int id) => await _repo.GetByIdAsync(id);

    public async Task<Department> CreateAsync(CreateDepartmentDto dto)
    {
        if (await _repo.NameExistsAsync(dto.Name))
            throw new Exception("Department name already exists");

        var dept = new Department
        {
            Name           = dto.Name,
            Description    = dto.Description,
            FloorNumber    = dto.FloorNumber,
            PhoneExtension = dto.PhoneExtension,
            IsActive       = true,
            CreatedAt      = DateTime.UtcNow
        };
        return await _repo.AddAsync(dept);
    }

    public async Task<Department> UpdateAsync(int id, CreateDepartmentDto dto)
    {
        var dept = await _repo.GetByIdAsync(id) ?? throw new Exception("Department not found");
        dept.Name           = dto.Name;
        dept.Description    = dto.Description;
        dept.FloorNumber    = dto.FloorNumber;
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
'@

# 6. Create DepartmentsController
$files["HospitalMS.PatientService.API/Controllers/DepartmentsController.cs"] = @'
using HospitalMS.PatientService.Application.DTOs;
using HospitalMS.PatientService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace HospitalMS.PatientService.API.Controllers;

[ApiController]
[Route("api/departments")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _svc;
    public DepartmentsController(IDepartmentService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _svc.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var d = await _svc.GetByIdAsync(id);
        return d == null ? NotFound() : Ok(d);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentDto dto)
    {
        try { return Ok(await _svc.CreateAsync(dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateDepartmentDto dto)
    {
        try { return Ok(await _svc.UpdateAsync(id, dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Deactivate(int id)
    {
        try { await _svc.DeactivateAsync(id); return NoContent(); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}
'@

# Write files
foreach ($f in $files.Keys) {
    $dir = Split-Path $f -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    Set-Content -Path $f -Value $files[$f]
}
