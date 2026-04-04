using HospitalMS.NotificationService.Application.Hubs;
using HospitalMS.NotificationService.Application.Interfaces;
using HospitalMS.NotificationService.Domain.Entities;
using HospitalMS.NotificationService.Domain.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace HospitalMS.NotificationService.Application.Services;

public class NotificationService : INotificationService
{
    private readonly INotificationRepository _repo;
    private readonly IHubContext<HospitalHub> _hub;

    public NotificationService(INotificationRepository repo, IHubContext<HospitalHub> hub)
    { 
        _repo = repo; 
        _hub = hub; 
    }

    // Called by OTHER services to create + send live notification
    public async Task SendAsync(int userId, string title, string message, string type)
    {
        // 1. Save to DB
        var notification = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            Channel = "InApp",
            IsRead = false,
            SentAt = DateTime.UtcNow
        };
        await _repo.AddAsync(notification);

        // 2. Push live via SignalR to that specific user's group
        await _hub.Clients.Group($"user_{userId}")
            .SendAsync("ReceiveNotification", new {
                notification.Id,
                notification.Title,
                notification.Message,
                notification.Type,
                notification.SentAt
            });
    }

    public async Task<List<Notification>> GetMyNotificationsAsync(int userId)
        => await _repo.GetByUserIdAsync(userId);

    public async Task<int> GetUnreadCountAsync(int userId)
        => await _repo.GetUnreadCountAsync(userId);

    public async Task MarkAsReadAsync(int id)
        => await _repo.MarkAsReadAsync(id);

    public async Task MarkAllAsReadAsync(int userId)
        => await _repo.MarkAllAsReadAsync(userId);
}
