using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;
using HospitalMS.PatientService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.PatientService.Infrastructure.Repositories;

public class AppointmentRepository : IAppointmentRepository
{
    private readonly PatientDbContext _db;
    public AppointmentRepository(PatientDbContext db) => _db = db;

    public async Task<List<Appointment>> GetAllAsync()
        => await _db.Appointments
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Department)
            .ToListAsync();

    public async Task<Appointment?> GetByIdAsync(int id)
        => await _db.Appointments
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Department)
            .FirstOrDefaultAsync(a => a.Id == id);

    public async Task<List<Appointment>> GetByPatientIdAsync(int patientId)
        => await _db.Appointments
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Department)
            .Where(a => a.PatientId == patientId)
            .OrderByDescending(a => a.AppointmentDate)
            .ToListAsync();

    public async Task<List<Appointment>> GetByDoctorIdAsync(int doctorId)
        => await _db.Appointments
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Department)
            .Where(a => a.DoctorId == doctorId).ToListAsync();

    public async Task<List<Appointment>> GetByDateAsync(DateOnly date)
        => await _db.Appointments
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Department)
            .Where(a => a.AppointmentDate == date).ToListAsync();

    public async Task<List<Appointment>> GetByDoctorAndDateAsync(int doctorId, DateOnly date)
        => await _db.Appointments
            .Include(a => a.Doctor)
                .ThenInclude(d => d.Department)
            .Where(a => a.DoctorId == doctorId && a.AppointmentDate == date && a.Status != "Cancelled").ToListAsync();

    public async Task<int> GetNextTokenAsync(int doctorId, DateOnly date)
    {
        var maxToken = await _db.Appointments
            .Where(a => a.DoctorId == doctorId && a.AppointmentDate == date)
            .MaxAsync(a => (int?)a.TokenNumber) ?? 0;
        return maxToken + 1; // next token number
    }

    public async Task<Appointment> AddAsync(Appointment a)
    {
        _db.Appointments.Add(a);
        await _db.SaveChangesAsync();
        return a;
    }

    public async Task UpdateAsync(Appointment a)
    {
        _db.Appointments.Update(a);
        await _db.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(int doctorId, DateOnly date, TimeOnly time)
        => await _db.Appointments.AnyAsync(a =>
            a.DoctorId == doctorId &&
            a.AppointmentDate == date &&
            a.AppointmentTime == time &&
            a.Status != "Cancelled");

    public async Task<bool> PatientHasAppointmentAsync(int patientId, int doctorId, DateOnly date)
        => await _db.Appointments.AnyAsync(a =>
            a.PatientId == patientId && a.DoctorId == doctorId &&
            a.AppointmentDate == date && a.Status != "Cancelled");

    public async Task<int> GetDoctorDayCountAsync(int doctorId, DateOnly date)
        => await _db.Appointments.CountAsync(a =>
            a.DoctorId == doctorId && a.AppointmentDate == date &&
            a.Status != "Cancelled");
}
