using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HospitalMS.PatientService.Application.Hubs;

[Authorize] // only authenticated users can connect
public class HospitalHub : Hub
{
    // Called when user connects — put them in their role group
    public override async Task OnConnectedAsync()
    {
        var role = Context.User?.FindFirst("role")?.Value ?? "Patient";
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        // Add to role-based group (Admin sees all alerts)
        await Groups.AddToGroupAsync(Context.ConnectionId, role);

        // Add to personal group (userId) for private notifications
        if (userId != null)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }

    // Client calls this to join a specific group manually
    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }
}
