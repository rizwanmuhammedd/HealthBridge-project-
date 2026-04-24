// HospitalMS.HospitalOpsService.Application/DTOs/LabDtos.cs
namespace HospitalMS.HospitalOpsService.Application.DTOs;

public class OrderLabTestDto
{
    public int PatientId { get; set; }
    public int LabTestId { get; set; }
    public int? AppointmentId { get; set; }
}

public class UploadResultDto
{
    public string ResultValue { get; set; } = string.Empty;
    // 'Haemoglobin: 13.5 g/dL' | 'Blood Glucose: 110 mg/dL'
    public string? ResultNotes { get; set; }
    public bool IsAbnormal { get; set; }
    // true = shown in red on patient dashboard
}

public class LabOrderDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public int LabTestId { get; set; }
    public string TestName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Status { get; set; } = string.Empty;
    // Pending | SampleCollected | InProgress | ResultReady | Cancelled
    public string? ResultValue { get; set; }
    public string? ResultNotes { get; set; }
    public bool IsAbnormal { get; set; }
    public DateTime OrderedAt { get; set; }
    public DateTime? ResultUploadedAt { get; set; }
}
