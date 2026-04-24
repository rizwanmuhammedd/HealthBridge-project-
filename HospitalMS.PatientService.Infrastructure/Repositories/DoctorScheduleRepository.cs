using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;
using HospitalMS.PatientService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.PatientService.Infrastructure.Repositories;

public class DoctorScheduleRepository : IDoctorScheduleRepository
{
    private readonly PatientDbContext _context;

    public DoctorScheduleRepository(PatientDbContext context)
    {
        _context = context;
    }

    public async Task<List<DoctorSchedule>> GetByDoctorIdAsync(int doctorId)
    {
        return await _context.DoctorSchedules
            .Where(s => s.DoctorId == doctorId)
            .OrderBy(s => s.ScheduleDate)
            .ToListAsync();
    }

    public async Task<List<DoctorSchedule>> GetByDoctorAndDateAsync(int doctorId, DateOnly date)
    {
        return await _context.DoctorSchedules
            .Where(s => s.DoctorId == doctorId && s.ScheduleDate == date)
            .ToListAsync();
    }

    public async Task<DoctorSchedule> AddAsync(DoctorSchedule schedule)
    {
        _context.DoctorSchedules.Add(schedule);
        await _context.SaveChangesAsync();
        return schedule;
    }

    public async Task UpdateAsync(DoctorSchedule schedule)
    {
        _context.DoctorSchedules.Update(schedule);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var schedule = await _context.DoctorSchedules.FindAsync(id);
        if (schedule != null)
        {
            _context.DoctorSchedules.Remove(schedule);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<DoctorSchedule?> GetByIdAsync(int id)
    {
        return await _context.DoctorSchedules.FindAsync(id);
    }
}
