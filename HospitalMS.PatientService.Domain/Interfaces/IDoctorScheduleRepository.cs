using HospitalMS.PatientService.Domain.Entities;

namespace HospitalMS.PatientService.Domain.Interfaces;

public interface IDoctorScheduleRepository
{
    Task<List<DoctorSchedule>> GetByDoctorIdAsync(int doctorId);
    Task<List<DoctorSchedule>> GetByDoctorAndDateAsync(int doctorId, DateOnly date);
    Task<DoctorSchedule> AddAsync(DoctorSchedule schedule);
    Task UpdateAsync(DoctorSchedule schedule);
    Task DeleteAsync(int id);
    Task<DoctorSchedule?> GetByIdAsync(int id);
}
