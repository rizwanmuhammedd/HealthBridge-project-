using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace HospitalMS.HospitalOpsService.API.Controllers;

[ApiController]
[Route("api/bills")]
[Authorize]
public class BillsController : ControllerBase
{
    private readonly IBillService _svc;
    public BillsController(IBillService svc) => _svc = svc;
    
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    { 
        var r = await _svc.GetByIdAsync(id); 
        return r == null ? NotFound() : Ok(r); 
    }
    
    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetByPatient(int patientId)
        => Ok(await _svc.GetByPatientAsync(patientId));
        
    [HttpPost]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> Generate([FromBody] CreateBillDto dto)
    {
        try { return Ok(await _svc.GenerateBillAsync(dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
    
    [HttpPost("{id}/payment")]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> Pay(int id, [FromBody] PaymentDto dto)
    {
        try { await _svc.ProcessPaymentAsync(id, dto); return NoContent(); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}
