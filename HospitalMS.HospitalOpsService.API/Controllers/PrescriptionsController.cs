using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.API.Controllers;

[ApiController]
[Route("api/prescriptions")]
[Authorize]
public class PrescriptionsController : ControllerBase
{
    private readonly IPrescriptionService _svc;
    public PrescriptionsController(IPrescriptionService svc) => _svc = svc;
    
    [HttpGet("pending")]
    [Authorize(Roles = "Pharmacist,Admin")]
    public async Task<IActionResult> GetPending()
        => Ok(await _svc.GetPendingAsync());
        
    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetByPatient(int patientId)
        => Ok(await _svc.GetByPatientIdAsync(patientId));
        
    [HttpPost]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> Create([FromBody] CreatePrescriptionDto dto)
    {
        try { return Ok(await _svc.CreateAsync(dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
    
    [HttpPost("{id}/dispense")]
    [Authorize(Roles = "Pharmacist,Admin")]
    public async Task<IActionResult> Dispense(int id)
    {
        int pharmacistId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        try { return Ok(await _svc.DispenseAsync(id, pharmacistId)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}
