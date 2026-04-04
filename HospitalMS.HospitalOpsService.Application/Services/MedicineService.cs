using HospitalMS.HospitalOpsService.Application.Hubs;
using HospitalMS.HospitalOpsService.Application.Interfaces;
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace HospitalMS.HospitalOpsService.Application.Services;

public class MedicineService : IMedicineService
{
    private readonly IMedicineRepository _repo;
    private readonly IHubContext<HospitalHub> _hub; // SignalR hub

    public MedicineService(IMedicineRepository repo, IHubContext<HospitalHub> hub)
    { 
        _repo = repo; 
        _hub = hub; 
    }

    public async Task<List<Medicine>> GetAllAsync()
        => await _repo.GetAllAsync();

    public async Task<Medicine> AddAsync(Medicine medicine)
    {
        medicine.CreatedAt = DateTime.UtcNow;
        return await _repo.AddAsync(medicine);
    }

    public async Task UpdateStockAsync(int id, int newQty)
    {
        await _repo.UpdateStockAsync(id, newQty);
        // Check if low stock AFTER update — fire SignalR alert
        var medicine = await _repo.GetByIdAsync(id);
        if (medicine != null && medicine.StockQuantity <= medicine.MinimumStockLevel)
        {
            // Send real-time alert to all Admin users
            await _hub.Clients.Group("Admin")
                .SendAsync("LowStockAlert", new {
                    MedicineId = id,
                    Name = medicine.Name,
                    CurrentStock = medicine.StockQuantity,
                    MinimumStock = medicine.MinimumStockLevel
                });
        }
    }

    public async Task<List<Medicine>> GetLowStockAsync()
        => await _repo.GetLowStockAsync();
}
