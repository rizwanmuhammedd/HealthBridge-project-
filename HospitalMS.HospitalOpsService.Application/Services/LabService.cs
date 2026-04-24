// HospitalMS.HospitalOpsService.Application/Services/LabService.cs
using HospitalMS.HospitalOpsService.Application.DTOs;
using HospitalMS.HospitalOpsService.Application.Interfaces;
using HospitalMS.HospitalOpsService.Domain.Entities;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
namespace HospitalMS.HospitalOpsService.Application.Services;

public class LabService : ILabService
{
    private readonly ILabOrderRepository _repo;

    public LabService(ILabOrderRepository repo) => _repo = repo;

    // Doctor orders a lab test
    public async Task<LabOrderDto> OrderTestAsync(
        int doctorId, OrderLabTestDto dto)
    {
        var order = new LabOrder
        {
            PatientId     = dto.PatientId,
            DoctorId      = doctorId,
            LabTestId     = dto.LabTestId,
            AppointmentId = dto.AppointmentId,
            Status        = "Pending",
            OrderedAt     = DateTime.UtcNow
        };

        var saved = await _repo.AddAsync(order);
        return Map(saved);
    }

    // Lab technician uploads result
    public async Task<LabOrderDto> UploadResultAsync(
        int orderId, UploadResultDto dto)
    {
        var order = await _repo.GetByIdAsync(orderId);
        if (order == null)
            throw new Exception("Lab order not found");
        if (order.Status == "ResultReady")
            throw new Exception("Result already uploaded for this order");

        order.Status             = "ResultReady";
        order.ResultValue        = dto.ResultValue;
        order.ResultNotes        = dto.ResultNotes;
        order.IsAbnormal         = dto.IsAbnormal;
        order.ResultUploadedAt   = DateTime.UtcNow;
        await _repo.UpdateAsync(order);

        return Map(order);
    }

    public async Task<List<LabOrderDto>> GetPendingAsync()
        => (await _repo.GetPendingAsync()).Select(Map).ToList();

    public async Task<List<LabOrderDto>> GetByPatientAsync(int patientId)
        => (await _repo.GetByPatientAsync(patientId)).Select(Map).ToList();

    private static LabOrderDto Map(LabOrder l) => new()
    {
        Id               = l.Id,
        PatientId        = l.PatientId,
        DoctorId         = l.DoctorId,
        LabTestId        = l.LabTestId,
        TestName         = l.LabTest?.TestName ?? string.Empty,
        Category         = l.LabTest?.Category ?? string.Empty,
        Price            = l.LabTest?.Price ?? 0,
        Status           = l.Status,
        ResultValue      = l.ResultValue,
        ResultNotes      = l.ResultNotes,
        IsAbnormal       = l.IsAbnormal,
        OrderedAt        = l.OrderedAt,
        ResultUploadedAt = l.ResultUploadedAt
    };
}
