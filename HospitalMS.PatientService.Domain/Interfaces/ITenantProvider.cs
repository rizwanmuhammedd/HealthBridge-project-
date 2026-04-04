namespace HospitalMS.PatientService.Domain.Interfaces;
public interface ITenantProvider
{
    int TenantId { get; }
}
