using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
namespace HospitalMS.HospitalOpsService.API.Controllers;

[ApiController]
[Route("api/lab")]
[Authorize]
public class LabController : ControllerBase
{
    private readonly ILabService _svc;
    public LabController(ILabService svc) => _svc = svc;

    // Lab tech sees pending orders
    [HttpGet("pending")]
    [Authorize(Roles = "LabTechnician,Admin")]
    public async Task<IActionResult> GetPending()
        => Ok(await _svc.GetPendingAsync());

    // Patient sees their lab results
    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetByPatient(int patientId)
        => Ok(await _svc.GetByPatientAsync(patientId));

    // Doctor orders a test
    [HttpPost]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> Order([FromBody] OrderLabTestDto dto)
    {
        var doctorId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        try { return Ok(await _svc.OrderTestAsync(doctorId, dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    // Lab tech uploads result
    [HttpPatch("{id}/result")]
    [Authorize(Roles = "LabTechnician")]
    public async Task<IActionResult> UploadResult(int id, [FromBody] UploadResultDto dto)
    {
        try { return Ok(await _svc.UploadResultAsync(id, dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}
