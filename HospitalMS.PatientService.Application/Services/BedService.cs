using HospitalMS.PatientService.Application.DTOs;
using HospitalMS.PatientService.Application.Interfaces;
using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalMS.PatientService.Application.Services;

public class BedService : IBedService
{
    private readonly IBedRepository _repository;

    public BedService(IBedRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<BedDto>> GetAllAsync()
    {
        var beds = await _repository.GetAllAsync();
        return beds.Select(Map).ToList();
    }

    public async Task<List<BedDto>> GetAvailableAsync()
    {
        var beds = await _repository.GetAvailableAsync();
        return beds.Select(Map).ToList();
    }

    public async Task<BedDto?> GetByIdAsync(int id)
    {
        var bed = await _repository.GetByIdAsync(id);
        return bed == null ? null : Map(bed);
    }

    public async Task<BedDto> AddAsync(BedDto dto)
    {
        var bed = new Bed
        {
            BedNumber = dto.BedNumber,
            WardType = dto.WardType,
            Status = "Available"
            // TenantId will be set automatically by DbContext SaveChangesAsync
        };
        var saved = await _repository.AddAsync(bed);
        return Map(saved);
    }

    public async Task UpdateStatusAsync(int bedId, string status) => await _repository.UpdateStatusAsync(bedId, status);

    private static BedDto Map(Bed b) => new()
    {
        Id = b.Id,
        BedNumber = b.BedNumber,
        WardType = b.WardType,
        Status = b.Status
    };
}
