using HospitalMS.PatientService.Application.DTOs;
using HospitalMS.PatientService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace HospitalMS.PatientService.API.Controllers;

[ApiController]
[Route("api/departments")]
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _svc;
    public DepartmentsController(IDepartmentService svc) => _svc = svc;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
        => Ok(await _svc.GetAllAsync());

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var d = await _svc.GetByIdAsync(id);
        return d == null ? NotFound() : Ok(d);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]    public async Task<IActionResult> Create([FromBody] CreateDepartmentDto dto)
    {
        try { return Ok(await _svc.CreateAsync(dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateDepartmentDto dto)
    {
        try { return Ok(await _svc.UpdateAsync(id, dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Deactivate(int id)
    {
        try { await _svc.DeactivateAsync(id); return NoContent(); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}
