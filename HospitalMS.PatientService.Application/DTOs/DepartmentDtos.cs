namespace HospitalMS.PatientService.Application.DTOs;

public class CreateDepartmentDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int FloorNumber { get; set; }
    public string? PhoneExtension { get; set; }
}

public class CreateDoctorDto
{
    public int UserId { get; set; }
    public int DepartmentId { get; set; }
    public string Specialization { get; set; } = string.Empty;
    public string Qualification { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public decimal ConsultationFee { get; set; }
    public int MaxPatientsPerDay { get; set; }
}
