using HospitalMS.PatientService.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalMS.PatientService.Application.Interfaces;

public interface IBedService
{
    Task<List<BedDto>> GetAllAsync();
    Task<List<BedDto>> GetAvailableAsync();
    Task<BedDto?> GetByIdAsync(int id);
    Task<BedDto> AddAsync(BedDto dto);
    Task UpdateStatusAsync(int bedId, string status);
}
