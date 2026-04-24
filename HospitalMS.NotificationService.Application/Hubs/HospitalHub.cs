using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using HospitalMS.NotificationService.Domain.Entities;
using HospitalMS.NotificationService.Domain.Interfaces;

namespace HospitalMS.NotificationService.Application.Hubs;

[Authorize]
public class HospitalHub : Hub
{
    private readonly IChatRepository _chatRepo;

    public HospitalHub(IChatRepository chatRepo)
    {
        _chatRepo = chatRepo;
    }

    public override async Task OnConnectedAsync()
    {
        // Try multiple claim types for role to be robust
        var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value ?? 
                   Context.User?.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value ??
                   Context.User?.FindFirst("role")?.Value ?? "Patient";
                   
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                     Context.User?.FindFirst("sub")?.Value;

        // Join group for their role (e.g., Admin, Doctor, Receptionist)
        await Groups.AddToGroupAsync(Context.ConnectionId, role);
        
        // Join private group for their specific user ID
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }

    // Patient sends enquiry to all receptionists
    public async Task SendEnquiry(string patientName, string message)
    {
        var patientId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                        Context.User?.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(patientId)) return;

        var msg = new ChatMessage
        {
            PatientId = patientId,
            PatientName = patientName,
            Message = message,
            Timestamp = DateTime.UtcNow,
            IsFromPatient = true
        };

        await _chatRepo.AddMessageAsync(msg);
                        
        var enquiry = new { 
            Id = msg.Id,
            PatientId = patientId, 
            PatientName = patientName, 
            Message = message, 
            Timestamp = msg.Timestamp,
            IsFromPatient = true
        };

        // Notify all receptionists
        await Clients.Group("Receptionist").SendAsync("ReceiveEnquiry", enquiry);
        
        // Echo to patient's OTHER connections only
        await Clients.OthersInGroup($"user_{patientId}").SendAsync("ReceiveEnquiry", enquiry);
    }

    // Receptionist replies to a specific patient
    public async Task ReplyEnquiry(string patientId, string message)
    {
        var receptionistName = Context.User?.FindFirst("FullName")?.Value ?? 
                               Context.User?.Identity?.Name ?? "Receptionist";

        var msg = new ChatMessage
        {
            PatientId = patientId,
            ReceptionistName = receptionistName,
            Message = message,
            Timestamp = DateTime.UtcNow,
            IsFromPatient = false
        };

        await _chatRepo.AddMessageAsync(msg);
                               
        var reply = new { 
            Id = msg.Id,
            PatientId = patientId, 
            ReceptionistName = receptionistName, 
            Message = message, 
            Timestamp = msg.Timestamp,
            IsFromPatient = false
        };

        // Notify the specific patient
        await Clients.Group($"user_{patientId}").SendAsync("ReceiveEnquiry", reply);
        
        // Notify other receptionists
        await Clients.OthersInGroup("Receptionist").SendAsync("ReceiveEnquiry", reply);
    }

    // Example: Allow client to send message to a specific user (if needed)
    public async Task SendMessageToUser(string userId, string message)
    {
        await Clients.Group($"user_{userId}").SendAsync("ReceiveMessage", Context.User?.Identity?.Name, message);
    }
}
