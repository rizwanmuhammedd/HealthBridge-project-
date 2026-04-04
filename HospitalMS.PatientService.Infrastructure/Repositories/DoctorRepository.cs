using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;
using HospitalMS.PatientService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HospitalMS.PatientService.Infrastructure.Repositories;

public class DoctorRepository : IDoctorRepository
{
    private readonly PatientDbContext _db;
    public DoctorRepository(PatientDbContext db) => _db = db;

    public async Task<List<Doctor>> GetAllAsync()
        => await _db.Doctors.Include(d => d.Department).ToListAsync();

    public async Task<Doctor?> GetByIdAsync(int id)
        => await _db.Doctors.Include(d => d.Department).FirstOrDefaultAsync(d => d.Id == id);

    public async Task<List<Doctor>> GetByDepartmentAsync(int deptId)
        => await _db.Doctors.Where(d => d.DepartmentId == deptId).ToListAsync();

    public async Task<Doctor> AddAsync(Doctor doctor)
    {
        _db.Doctors.Add(doctor);
        await _db.SaveChangesAsync();
        return doctor;
    }

    public async Task UpdateAsync(Doctor doctor)
    {
        _db.Doctors.Update(doctor);
        await _db.SaveChangesAsync();
    }

    public async Task<bool> IsAvailableAsync(int doctorId, DateOnly date)
    {
        // Simple logic: check if doctor has reached max patients for that day
        var count = await _db.Appointments.CountAsync(a => a.DoctorId == doctorId && a.AppointmentDate == date && a.Status != "Cancelled");
        var doctor = await _db.Doctors.FindAsync(doctorId);
        return doctor != null && count < doctor.MaxPatientsPerDay;
    }
}
