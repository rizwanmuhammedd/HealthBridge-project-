using System;

namespace HospitalMS.NotificationService.Domain.Entities;

public class ChatMessage
{
    public int Id { get; set; }
    public string PatientId { get; set; } = null!;
    public string? PatientName { get; set; }
    public string? ReceptionistName { get; set; }
    public string Message { get; set; } = null!;
    public DateTime Timestamp { get; set; }
    public bool IsFromPatient { get; set; }
    public bool IsRead { get; set; }
    public int TenantId { get; set; }
}
