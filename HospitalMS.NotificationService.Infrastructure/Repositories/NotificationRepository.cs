using HospitalMS.NotificationService.Domain.Entities;
using HospitalMS.NotificationService.Domain.Interfaces;
using HospitalMS.NotificationService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.NotificationService.Infrastructure.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly NotificationDbContext _db;
    public NotificationRepository(NotificationDbContext db) => _db = db;

    public async Task<List<Notification>> GetByUserIdAsync(int userId)
        => await _db.Notifications.Where(n => n.UserId == userId)
        .OrderByDescending(n => n.SentAt).ToListAsync();

    public async Task<int> GetUnreadCountAsync(int userId)
        => await _db.Notifications.CountAsync(n => n.UserId == userId && n.IsRead == false);

    public async Task<Notification> AddAsync(Notification n)
    { 
        _db.Notifications.Add(n); 
        await _db.SaveChangesAsync(); 
        return n; 
    }

    public async Task MarkAsReadAsync(int id)
    {
        var n = await _db.Notifications.FindAsync(id);
        if (n == null) return;
        n.IsRead = true;
        n.ReadAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        var items = await _db.Notifications
            .Where(n => n.UserId == userId && n.IsRead == false).ToListAsync();
        foreach (var item in items) 
        { 
            item.IsRead = true; 
            item.ReadAt = DateTime.UtcNow; 
        }
        await _db.SaveChangesAsync();
    }
}
