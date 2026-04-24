using HospitalMS.NotificationService.Domain.Entities;
using HospitalMS.NotificationService.Domain.Interfaces;
using HospitalMS.NotificationService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.NotificationService.Infrastructure.Repositories;

public class ChatRepository : IChatRepository
{
    private readonly NotificationDbContext _db;

    public ChatRepository(NotificationDbContext db)
    {
        _db = db;
    }

    public async Task<ChatMessage> AddMessageAsync(ChatMessage message)
    {
        _db.ChatMessages.Add(message);
        await _db.SaveChangesAsync();
        return message;
    }

    public async Task<List<ChatMessage>> GetHistoryAsync(string patientId)
    {
        return await _db.ChatMessages
            .Where(m => m.PatientId == patientId)
            .OrderBy(m => m.Timestamp)
            .ToListAsync();
    }

    public async Task<IEnumerable<object>> GetUniquePatientsWithStatsAsync()
    {
        var stats = await _db.ChatMessages
            .GroupBy(m => m.PatientId)
            .Select(g => new {
                PatientId = g.Key,
                PatientName = g.Where(x => x.PatientName != null).Select(x => x.PatientName).FirstOrDefault(),
                LatestMessage = g.Max(x => x.Timestamp),
                UnreadCount = g.Count(x => x.IsFromPatient && !x.IsRead)
            })
            .OrderByDescending(x => x.LatestMessage)
            .ToListAsync();

        return stats;
    }

    public async Task MarkAsReadAsync(string patientId)
    {
        var unread = await _db.ChatMessages
            .Where(m => m.PatientId == patientId && m.IsFromPatient && !m.IsRead)
            .ToListAsync();

        if (unread.Any())
        {
            foreach (var msg in unread)
            {
                msg.IsRead = true;
            }
            await _db.SaveChangesAsync();
        }
    }
}
