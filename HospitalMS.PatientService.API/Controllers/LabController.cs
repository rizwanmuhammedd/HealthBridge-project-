using HospitalMS.PatientService.Application.DTOs;
using HospitalMS.PatientService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HospitalMS.PatientService.API.Controllers;

[ApiController]
[Route("api/lab")]
[Authorize]
public class LabController : ControllerBase
{
    private readonly ILabService _svc;
    public LabController(ILabService svc) => _svc = svc;

    [HttpGet("pending")]
    [Authorize(Roles = "LabTechnician,Admin")]
    public async Task<IActionResult> GetPending()
        => Ok(await _svc.GetPendingAsync());

    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetByPatient(int patientId)
        => Ok(await _svc.GetByPatientAsync(patientId));

    [HttpPost]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> OrderTest([FromBody] OrderLabTestDto dto)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

        int doctorId = int.Parse(userIdStr);
        var result = await _svc.OrderTestAsync(dto.PatientId, doctorId, dto.LabTestId, dto.AppointmentId);
        return Ok(result);
    }

    [HttpPatch("{id}/result")]
    [Authorize(Roles = "LabTechnician")]
    public async Task<IActionResult> UploadResult(int id, [FromBody] UploadLabResultDto dto)
    {
        await _svc.UploadResultAsync(id, dto.ResultValue, dto.Notes, dto.IsAbnormal);
        return NoContent();
    }
}
