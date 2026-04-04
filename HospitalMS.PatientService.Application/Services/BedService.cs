using HospitalMS.PatientService.Application.Interfaces;
using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;

namespace HospitalMS.PatientService.Application.Services;

public class BedService : IBedService
{
    private readonly IBedRepository _repository;

    public BedService(IBedRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<Bed>> GetAllAsync() => await _repository.GetAllAsync();

    public async Task<List<Bed>> GetAvailableAsync() => await _repository.GetAvailableAsync();

    public async Task<Bed?> GetByIdAsync(int id) => await _repository.GetByIdAsync(id);

    public async Task UpdateStatusAsync(int bedId, string status) => await _repository.UpdateStatusAsync(bedId, status);
}
