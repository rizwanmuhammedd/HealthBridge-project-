namespace HospitalMS.PatientService.Application.DTOs;

public class CreateDepartmentDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int FloorNumber { get; set; }
    public string? PhoneExtension { get; set; }
}

public class DepartmentDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int FloorNumber { get; set; }
    public string? PhoneExtension { get; set; }
    public bool IsActive { get; set; }
}
