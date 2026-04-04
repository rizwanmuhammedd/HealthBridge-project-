using HospitalMS.HospitalOpsService.Application.Interfaces;
using HospitalMS.HospitalOpsService.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HospitalMS.HospitalOpsService.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MedicinesController : ControllerBase
{
    private readonly IMedicineService _svc;
    public MedicinesController(IMedicineService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _svc.GetAllAsync());

    [HttpGet("low-stock")]
    [Authorize(Roles = "Admin,Pharmacist")]
    public async Task<IActionResult> GetLowStock()
        => Ok(await _svc.GetLowStockAsync());

    [HttpPost]
    [Authorize(Roles = "Admin,Pharmacist")]
    public async Task<IActionResult> Add([FromBody] Medicine medicine)
    {
        var result = await _svc.AddAsync(medicine);
        return CreatedAtAction(nameof(GetAll), result);
    }

    [HttpPatch("{id}/stock")]
    [Authorize(Roles = "Admin,Pharmacist")]
    public async Task<IActionResult> UpdateStock(int id, [FromBody] int newQty)
    {
        await _svc.UpdateStockAsync(id, newQty);
        return NoContent();
    }
}
