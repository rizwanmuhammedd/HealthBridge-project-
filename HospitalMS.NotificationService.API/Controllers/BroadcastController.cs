using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using HospitalMS.NotificationService.Application.Hubs;
using System.Threading.Tasks;

namespace HospitalMS.NotificationService.API.Controllers;

public class BroadcastRequest
{
    public string GroupName { get; set; } = string.Empty;
    public string EventName { get; set; } = string.Empty;
    public object Payload { get; set; } = new {};
}

[ApiController]
[Route("api/notifications")]
public class BroadcastController : ControllerBase
{
    private readonly IHubContext<HospitalHub> _hub;

    public BroadcastController(IHubContext<HospitalHub> hub)
    {
        _hub = hub;
    }

    [HttpPost("broadcast")]
    // In a real system, you would secure this with an internal API key or server-to-server auth.
    public async Task<IActionResult> Broadcast([FromBody] BroadcastRequest request)
    {
        if (string.IsNullOrEmpty(request.GroupName))
        {
            await _hub.Clients.All.SendAsync(request.EventName, request.Payload);
        }
        else
        {
            await _hub.Clients.Group(request.GroupName).SendAsync(request.EventName, request.Payload);
        }
        return Ok();
    }
}
