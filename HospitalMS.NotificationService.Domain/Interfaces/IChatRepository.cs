using HospitalMS.NotificationService.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalMS.NotificationService.Domain.Interfaces;

public interface IChatRepository
{
    Task<ChatMessage> AddMessageAsync(ChatMessage message);
    Task<List<ChatMessage>> GetHistoryAsync(string patientId);
    Task<IEnumerable<object>> GetUniquePatientsWithStatsAsync();
    Task MarkAsReadAsync(string patientId);
}
