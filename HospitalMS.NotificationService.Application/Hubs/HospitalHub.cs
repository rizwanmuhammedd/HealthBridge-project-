using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace HospitalMS.NotificationService.Application.Hubs;

[Authorize]
public class HospitalHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var role = Context.User?.FindFirst("role")?.Value ?? "Patient";
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        await Groups.AddToGroupAsync(Context.ConnectionId, role);
        if (userId != null)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
