using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Application.Interfaces;
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using System.Net.Http.Json;

namespace HospitalMS.HospitalOpsService.Application.Services;

public class MedicineService : IMedicineService
{
    private readonly IMedicineRepository _repo;
    private readonly HttpClient _httpClient;

    public MedicineService(IMedicineRepository repo, IHttpClientFactory httpClientFactory)
    {
        _repo = repo;
        _httpClient = httpClientFactory.CreateClient();
    }

    public async Task<List<MedicineDto>> GetAllAsync()
        => (await _repo.GetAllAsync()).Select(Map).ToList();

    public async Task<MedicineDto?> GetByIdAsync(int id)
    {
        var m = await _repo.GetByIdAsync(id);
        return m == null ? null : Map(m);
    }

    public async Task<List<MedicineDto>> GetLowStockAsync()
        => (await _repo.GetLowStockAsync()).Select(Map).ToList();

    public async Task<MedicineDto> CreateAsync(CreateMedicineDto dto)
    {
        var medicine = new Medicine
        {
            Name               = dto.Name,
            GenericName        = dto.GenericName,
            Category           = dto.Category,
            Manufacturer       = dto.Manufacturer,
            StockQuantity      = dto.StockQuantity,
            MinimumStockLevel  = dto.MinimumStockLevel,
            UnitPrice          = dto.UnitPrice,
            Unit               = dto.Unit,
            BatchNumber        = dto.BatchNumber,
            IsActive           = true,
            CreatedAt          = DateTime.UtcNow
        };

        if (!string.IsNullOrEmpty(dto.ExpiryDate))
            medicine.ExpiryDate = DateOnly.Parse(dto.ExpiryDate);

        var saved = await _repo.AddAsync(medicine);
        return Map(saved);
    }

    public async Task UpdateStockAsync(int id, int newQuantity)
    {
        if (newQuantity < 0)
            throw new Exception("Stock quantity cannot be negative");
        
        var medicine = await _repo.GetByIdAsync(id);
        if (medicine == null) throw new Exception("Medicine not found");

        await _repo.UpdateStockAsync(id, newQuantity);

        if (newQuantity <= medicine.MinimumStockLevel)
        {
            try
            {
                await _httpClient.PostAsJsonAsync("http://localhost:5004/api/notifications/role", new
                {
                    Role = "Pharmacist",
                    Title = "⚠ Low Stock Alert",
                    Message = $"Medicine '{medicine.Name}' is low on stock ({newQuantity} units left).",
                    Type = "warning"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to notify NotificationService: {ex.Message}");
            }
        }
    }

    private static MedicineDto Map(Medicine m) => new()
    {
        Id                = m.Id,
        Name              = m.Name,
        GenericName       = m.GenericName,
        Category          = m.Category,
        Manufacturer      = m.Manufacturer,
        StockQuantity     = m.StockQuantity,
        MinimumStockLevel = m.MinimumStockLevel,
        IsLowStock        = m.StockQuantity <= m.MinimumStockLevel,
        UnitPrice         = m.UnitPrice,
        Unit              = m.Unit,
        ExpiryDate        = m.ExpiryDate?.ToString("yyyy-MM-dd"),
        BatchNumber       = m.BatchNumber,
        IsActive          = m.IsActive
    };
}
