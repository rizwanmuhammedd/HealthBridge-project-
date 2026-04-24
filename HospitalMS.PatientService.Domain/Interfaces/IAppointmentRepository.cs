using HospitalMS.PatientService.Domain.Entities;

namespace HospitalMS.PatientService.Domain.Interfaces;

public interface IAppointmentRepository
{
    Task<List<Appointment>> GetAllAsync();
    Task<Appointment?> GetByIdAsync(int id);
    Task<List<Appointment>> GetByPatientIdAsync(int patientId);
    Task<List<Appointment>> GetByDoctorIdAsync(int doctorId);
    Task<List<Appointment>> GetByDateAsync(DateOnly date);
    Task<List<Appointment>> GetByDoctorAndDateAsync(int doctorId, DateOnly date);
    Task<int> GetNextTokenAsync(int doctorId, DateOnly date); // auto-assign token
    Task<Appointment> AddAsync(Appointment appointment);
    Task UpdateAsync(Appointment appointment);
    Task<bool> ExistsAsync(int doctorId, DateOnly date, TimeOnly time); // check slot
    Task<bool> PatientHasAppointmentAsync(int patientId, int doctorId, DateOnly date);
    Task<int> GetDoctorDayCountAsync(int doctorId, DateOnly date);
}
