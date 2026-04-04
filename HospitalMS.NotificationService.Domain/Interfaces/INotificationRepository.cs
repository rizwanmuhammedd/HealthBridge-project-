using HospitalMS.NotificationService.Domain.Entities;

namespace HospitalMS.NotificationService.Domain.Interfaces;

public interface INotificationRepository
{
    Task<List<Notification>> GetByUserIdAsync(int userId);
    Task<int> GetUnreadCountAsync(int userId);
    Task<Notification> AddAsync(Notification notification);
    Task MarkAsReadAsync(int id);
    Task MarkAllAsReadAsync(int userId);
}
