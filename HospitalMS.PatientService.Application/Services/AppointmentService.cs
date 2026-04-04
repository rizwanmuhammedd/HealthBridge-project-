using HospitalMS.PatientService.Application.DTOs;
using HospitalMS.PatientService.Application.Interfaces;
using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;

namespace HospitalMS.PatientService.Application.Services;

public class AppointmentService : IAppointmentService
{
    private readonly IAppointmentRepository _repo;
    private readonly IDoctorRepository _doctorRepo;

    public AppointmentService(IAppointmentRepository repo, IDoctorRepository doctorRepo)
    {
        _repo = repo;
        _doctorRepo = doctorRepo;
    }

    public async Task<List<AppointmentResponseDto>> GetAllAsync()
    {
        var list = await _repo.GetAllAsync();
        return list.Select(MapToDto).ToList();
    }

    public async Task<AppointmentResponseDto?> GetByIdAsync(int id)
    {
        var a = await _repo.GetByIdAsync(id);
        return a == null ? null : MapToDto(a);
    }

    public async Task<List<AppointmentResponseDto>> GetMyAppointmentsAsync(int patientId)
    {
        var list = await _repo.GetByPatientIdAsync(patientId);
        return list.Select(MapToDto).ToList();
    }

    public async Task<List<AppointmentResponseDto>> GetDoctorAppointmentsAsync(int doctorId)
    {
        var list = await _repo.GetByDoctorIdAsync(doctorId);
        return list.Select(MapToDto).ToList();
    }

    public async Task<AppointmentResponseDto> BookAsync(int patientId, BookAppointmentDto dto)
    {
        // 1. Check doctor exists and is available
        var doctor = await _doctorRepo.GetByIdAsync(dto.DoctorId);
        if (doctor == null) throw new Exception("Doctor not found");
        if (!doctor.IsAvailable) throw new Exception("Doctor is not currently available");

        // 2. Prevent past dates
        if (dto.AppointmentDate <= DateOnly.FromDateTime(DateTime.Today))
            throw new Exception("Appointment must be a future date");

        // 3. Check exact time slot not already taken
        bool slotTaken = await _repo.ExistsAsync(dto.DoctorId, dto.AppointmentDate, dto.AppointmentTime);
        if (slotTaken) throw new Exception("This time slot is already booked. Please choose another time.");

        // 4. Check patient doesn't already have appointment same day same doctor
        bool duplicate = await _repo.PatientHasAppointmentAsync(patientId, dto.DoctorId, dto.AppointmentDate);
        if (duplicate) throw new Exception("You already have an appointment with this doctor on this date.");

        // 5. Check max patients per day not exceeded
        int todayCount = await _repo.GetDoctorDayCountAsync(dto.DoctorId, dto.AppointmentDate);
        if (todayCount >= doctor.MaxPatientsPerDay)
            throw new Exception($"Doctor's schedule is full. Max {doctor.MaxPatientsPerDay} patients per day.");

        // 6. Auto-assign token number
        int token = await _repo.GetNextTokenAsync(dto.DoctorId, dto.AppointmentDate);

        var appointment = new Appointment
        {
            PatientId = patientId,
            DoctorId = dto.DoctorId,
            AppointmentDate = dto.AppointmentDate,
            AppointmentTime = dto.AppointmentTime,
            TokenNumber = token,
            Status = "Scheduled",
            ChiefComplaint = dto.ChiefComplaint,
            CreatedAt = DateTime.UtcNow
        };

        var created = await _repo.AddAsync(appointment);
        var reloaded = await _repo.GetByIdAsync(created.Id);
        return MapToDto(reloaded!);
    }

    public async Task UpdateAsync(int id, UpdateAppointmentDto dto)
    {
        var a = await _repo.GetByIdAsync(id)
            ?? throw new Exception("Appointment not found");

        a.Status = dto.Status;
        a.ConsultationNotes = dto.ConsultationNotes;
        a.Diagnosis = dto.Diagnosis;
        // a.UpdatedAt = DateTime.UtcNow; // Assuming UpdatedAt exists in entity
        await _repo.UpdateAsync(a);
    }

    public async Task CancelAsync(int id)
    {
        var a = await _repo.GetByIdAsync(id)
            ?? throw new Exception("Appointment not found");

        a.Status = "Cancelled";
        // a.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(a);
    }

    public async Task<List<string>> GetBookedTimesAsync(int doctorId, DateOnly date)
    {
        var appointments = await _repo.GetByDateAsync(date);
        return appointments
            .Where(a => a.DoctorId == doctorId && a.Status != "Cancelled")
            .Select(a => a.AppointmentTime.ToString("HH:mm"))
            .ToList();
    }

    // Helper — map entity to DTO
    private static AppointmentResponseDto MapToDto(Appointment a) => new()
    {
        Id = a.Id,
        PatientId = a.PatientId,
        DoctorName = a.Doctor != null ? $"Dr. {a.Doctor.Qualification}" : "Unknown", // Simplified for now
        DepartmentName = a.Doctor?.Department?.Name ?? "Unknown",
        AppointmentDate = a.AppointmentDate,
        AppointmentTime = a.AppointmentTime,
        TokenNumber = a.TokenNumber,
        Status = a.Status,
        ChiefComplaint = a.ChiefComplaint
    };
}
