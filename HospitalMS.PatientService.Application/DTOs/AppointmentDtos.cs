namespace HospitalMS.PatientService.Application.DTOs;

// Request DTO — what frontend sends when booking
public class BookAppointmentDto
{
    public int DoctorId { get; set; }
    public DateOnly AppointmentDate { get; set; }
    public TimeOnly AppointmentTime { get; set; }
    public string? ChiefComplaint { get; set; }
}

// Response DTO — what API returns
public class AppointmentResponseDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public DateOnly AppointmentDate { get; set; }
    public TimeOnly AppointmentTime { get; set; }
    public int TokenNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ChiefComplaint { get; set; }
}

// Update status DTO — doctor updates appointment
public class UpdateAppointmentDto
{
    public string Status { get; set; } = string.Empty; // Completed|Cancelled
    public string? ConsultationNotes { get; set; }
    public string? Diagnosis { get; set; }
}
