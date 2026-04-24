// HospitalMS.HospitalOpsService.Application/DTOs/MedicineDtos.cs
namespace HospitalMS.HospitalOpsService.Application.DTOs;

public class CreateMedicineDto
{
    public string Name { get; set; } = string.Empty;
    public string GenericName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    // Antibiotic | Analgesic | Antidiabetic | Antihypertensive | Vitamin
    public string Manufacturer { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
    public int MinimumStockLevel { get; set; } = 10;
    public decimal UnitPrice { get; set; }
    public string Unit { get; set; } = string.Empty;
    // Tablet | Capsule | Syrup | Injection | Cream
    public string? ExpiryDate { get; set; }
    // string format: '2026-12-31'
    public string? BatchNumber { get; set; }
}

public class MedicineDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string GenericName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public int StockQuantity { get; set; }
    public int MinimumStockLevel { get; set; }
    public bool IsLowStock { get; set; }
    // true when StockQuantity <= MinimumStockLevel
    public decimal UnitPrice { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string? ExpiryDate { get; set; }
    public string? BatchNumber { get; set; }
    public bool IsActive { get; set; }
}

public class UpdateStockDto
{
    public int NewQuantity { get; set; }
}
