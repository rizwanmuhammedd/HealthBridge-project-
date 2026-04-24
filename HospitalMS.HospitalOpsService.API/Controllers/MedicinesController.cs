using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace HospitalMS.HospitalOpsService.API.Controllers;

[ApiController]
[Route("api/medicines")]
[Authorize]
public class MedicinesController : ControllerBase
{
    private readonly IMedicineService _svc;
    public MedicinesController(IMedicineService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _svc.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var m = await _svc.GetByIdAsync(id);
        return m == null ? NotFound() : Ok(m);
    }

    [HttpGet("low-stock")]
    [Authorize(Roles = "Admin,Pharmacist")]
    public async Task<IActionResult> GetLowStock()
        => Ok(await _svc.GetLowStockAsync());

    [HttpPost]
    [Authorize(Roles = "Admin,Pharmacist")]
    public async Task<IActionResult> Create([FromBody] CreateMedicineDto dto)
    {
        try { return Ok(await _svc.CreateAsync(dto)); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPatch("{id}/stock")]
    [Authorize(Roles = "Admin,Pharmacist")]
    public async Task<IActionResult> UpdateStock(int id, [FromBody] UpdateStockDto dto)
    {
        try { await _svc.UpdateStockAsync(id, dto.NewQuantity); return NoContent(); }
        catch (Exception ex) { return BadRequest(new { message = ex.Message }); }
    }
}
