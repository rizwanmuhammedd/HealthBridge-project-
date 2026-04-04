using HospitalMS.PatientService.Application.Interfaces;
using HospitalMS.PatientService.Application.DTOs;
using HospitalMS.PatientService.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HospitalMS.PatientService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DoctorsController : ControllerBase
{
    private readonly IDoctorService _doctorService;

    public DoctorsController(IDoctorService doctorService)
    {
        _doctorService = doctorService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var doctors = await _doctorService.GetAllAsync();
        return Ok(doctors);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var doctor = await _doctorService.GetByIdAsync(id);
        if (doctor == null)
            return NotFound();
        return Ok(doctor);
    }

    [HttpGet("department/{deptId}")]
    public async Task<IActionResult> GetByDepartment(int deptId)
    {
        var doctors = await _doctorService.GetByDepartmentAsync(deptId);
        return Ok(doctors);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(CreateDoctorDto doctor)
    {
        var created = await _doctorService.CreateAsync(doctor);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, Doctor doctor)
    {
        if (id != doctor.Id) return BadRequest();
        await _doctorService.UpdateAsync(doctor);
        return NoContent();
    }
}
