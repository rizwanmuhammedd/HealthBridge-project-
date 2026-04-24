using HospitalMS.PatientService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HospitalMS.PatientService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BedsController : ControllerBase
{
    private readonly IBedService _svc;
    public BedsController(IBedService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _svc.GetAllAsync());

    [HttpGet("available")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailable()
        => Ok(await _svc.GetAvailableAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _svc.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
    {
        await _svc.UpdateStatusAsync(id, status);
        return NoContent();
    }
}
