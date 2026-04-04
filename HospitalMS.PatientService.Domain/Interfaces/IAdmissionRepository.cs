using HospitalMS.PatientService.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalMS.PatientService.Domain.Interfaces;

public interface IAdmissionRepository
{
    Task<List<Admission>> GetAllActiveAsync();
    Task<Admission?> GetByIdAsync(int id);
    Task<List<Admission>> GetByPatientIdAsync(int patientId);
    Task<Admission> AddAsync(Admission admission);
    Task UpdateAsync(Admission admission);
    Task<bool> IsPatientAdmittedAsync(int patientId);
}
