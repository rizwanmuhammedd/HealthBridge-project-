using HospitalMS.PatientService.Application.DTOs;
using HospitalMS.PatientService.Application.Interfaces;
using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;

namespace HospitalMS.PatientService.Application.Services;

public class DoctorService : IDoctorService
{
    private readonly IDoctorRepository _repository;

    public DoctorService(IDoctorRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<Doctor>> GetAllAsync() => await _repository.GetAllAsync();

    public async Task<Doctor?> GetByIdAsync(int id) => await _repository.GetByIdAsync(id);

    public async Task<List<Doctor>> GetByDepartmentAsync(int deptId) => await _repository.GetByDepartmentAsync(deptId);

    public async Task<Doctor> CreateAsync(CreateDoctorDto dto)
    {
        var doctor = new Doctor
        {
            UserId = dto.UserId,
            DepartmentId = dto.DepartmentId,
            Specialization = dto.Specialization,
            Qualification = dto.Qualification,
            LicenseNumber = dto.LicenseNumber,
            ConsultationFee = dto.ConsultationFee,
            MaxPatientsPerDay = dto.MaxPatientsPerDay,
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow
        };
        return await _repository.AddAsync(doctor);
    }

    public async Task UpdateAsync(Doctor doctor) => await _repository.UpdateAsync(doctor);

    public async Task DeactivateAsync(int id)
    {
        var doctor = await _repository.GetByIdAsync(id) ?? throw new Exception("Doctor not found");
        // For doctors, we might just set IsAvailable to false or have an IsActive flag.
        // The guide mentions ToggleAvailability, so I'll use that for now.
        doctor.IsAvailable = false;
        await _repository.UpdateAsync(doctor);
    }

    public async Task ToggleAvailabilityAsync(int id)
    {
        var doctor = await _repository.GetByIdAsync(id) ?? throw new Exception("Doctor not found");
        doctor.IsAvailable = !doctor.IsAvailable;
        await _repository.UpdateAsync(doctor);
    }
}
