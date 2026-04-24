using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HospitalMS.PatientService.Application.Services;
using HospitalMS.PatientService.Application.DTOs;
using HospitalMS.PatientService.Application.Interfaces;

namespace HospitalMS.PatientService.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize] // Require authentication for all methods
public class AdminController : ControllerBase
{
    private readonly IDepartmentService _deptSvc;
    private readonly IDoctorService _docSvc;

    public AdminController(IDepartmentService deptSvc, IDoctorService docSvc)
    {
        _deptSvc = deptSvc;
        _docSvc = docSvc;
    }

    // ■■ DEPARTMENTS ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
    [HttpGet("departments")]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> GetDepts() => Ok(await _deptSvc.GetAllAsync());

    [HttpPost("departments")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateDept([FromBody] CreateDepartmentDto dto)
    {
        try { return Ok(await _deptSvc.CreateAsync(dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("departments/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateDept(int id, [FromBody] CreateDepartmentDto dto)
    {
        try { return Ok(await _deptSvc.UpdateAsync(id, dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("departments/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteDept(int id)
    {
        try { await _deptSvc.DeactivateAsync(id); return NoContent(); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    // ■■ DOCTORS ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
    [HttpGet("doctors")]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> GetDoctors() => Ok(await _docSvc.GetAllAsync());

    [HttpPost("doctors")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateDoctor([FromBody] CreateDoctorDto dto)
    {
        try { return Ok(await _docSvc.CreateAsync(dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("doctors/{id:int}/availability")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleAvailability(int id)
    {
        try { await _docSvc.ToggleAvailabilityAsync(id); return NoContent(); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    // ■■ ADMIN STATS DASHBOARD ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
    [HttpGet("stats")]
    [Authorize(Roles = "Admin,Patient,Receptionist,Doctor,LabTechnician,Pharmacist")]
    public async Task<IActionResult> GetAdminStats([FromServices] IAppointmentService apptSvc)
    {
        var todayAppts = await apptSvc.GetAllAsync(); // Simplified for now
        var totalDoctors = await _docSvc.GetAllAsync();
        var totalDepts = await _deptSvc.GetAllAsync();

        return Ok(new {
            TodayAppointments = todayAppts.Count(a => a.AppointmentDate == DateOnly.FromDateTime(DateTime.Today)),
            TotalDoctors = totalDoctors.Count,
            TotalDepartments = totalDepts.Count,
        });
    }
}
