using HospitalMS.PatientService.Application.DTOs;
using HospitalMS.PatientService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HospitalMS.PatientService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // all routes need JWT token
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _svc;
    public AppointmentsController(IAppointmentService svc) => _svc = svc;

    // GET api/appointments — Admin/Receptionist sees all
    [HttpGet]
    [Authorize(Roles = "Admin,Receptionist")]
    public async Task<IActionResult> GetAll()
    {
        var list = await _svc.GetAllAsync();
        return Ok(list);
    }

    // GET api/appointments/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _svc.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    // GET api/appointments/my — patient sees own appointments
    [HttpGet("my")]
    [Authorize(Roles = "Patient")]
    public async Task<IActionResult> GetMy()
    {
        // Read patientId from JWT token claims
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
        
        int patientId = int.Parse(userIdStr);
        var list = await _svc.GetMyAppointmentsAsync(patientId);
        return Ok(list);
    }

    // GET api/appointments/doctor/3
    [HttpGet("doctor/{doctorId}")]
    [Authorize(Roles = "Doctor,Admin")]
    public async Task<IActionResult> GetByDoctor(int doctorId)
    {
        var list = await _svc.GetDoctorAppointmentsAsync(doctorId);
        return Ok(list);
    }

    // GET api/appointments/slots/3?date=2024-04-05
    [HttpGet("slots/{doctorId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailableSlots(int doctorId, [FromQuery] string date)
    {
        if (!DateOnly.TryParse(date, out var d))
            return BadRequest(new { message = "Invalid date format. Use YYYY-MM-DD." });

        var bookedTimes = await _svc.GetBookedTimesAsync(doctorId, d);

        // Generate 30-min slots from 9:00 to 17:00
        var allSlots = new List<string>();
        var start = new TimeOnly(9, 0);
        var end = new TimeOnly(17, 0);

        while (start <= end)
        {
            allSlots.Add(start.ToString("HH:mm"));
            start = start.AddMinutes(30);
        }

        var available = allSlots
            .Where(s => !bookedTimes.Contains(s))
            .ToList();

        return Ok(new { date = d, doctorId, availableSlots = available });
    }

    // POST api/appointments — patient books
    [HttpPost]
    [Authorize(Roles = "Patient,Receptionist")]
    public async Task<IActionResult> Book([FromBody] BookAppointmentDto dto)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

        int patientId = int.Parse(userIdStr);
        try 
        {
            var result = await _svc.BookAsync(patientId, dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // PUT api/appointments/5 — doctor updates notes/status
    [HttpPut("{id}")]
    [Authorize(Roles = "Doctor,Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAppointmentDto dto)
    {
        await _svc.UpdateAsync(id, dto);
        return NoContent();
    }

    // DELETE api/appointments/5/cancel
    [HttpDelete("{id}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        await _svc.CancelAsync(id);
        return NoContent();
    }
}
