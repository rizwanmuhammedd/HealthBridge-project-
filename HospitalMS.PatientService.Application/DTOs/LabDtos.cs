namespace HospitalMS.PatientService.Application.DTOs;

public class OrderLabTestDto
{
    public int PatientId { get; set; }
    public int LabTestId { get; set; }
    public int? AppointmentId { get; set; }
}

public class UploadLabResultDto
{
    public string ResultValue { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public bool IsAbnormal { get; set; }
}
