using HospitalMS.PatientService.Application.Hubs;
using HospitalMS.PatientService.Application.DTOs;
using HospitalMS.PatientService.Application.Interfaces;
using HospitalMS.PatientService.Domain.Entities;
using HospitalMS.PatientService.Domain.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace HospitalMS.PatientService.Application.Services;

public class LabService : ILabService
{
    private readonly ILabOrderRepository _repo;
    private readonly IHubContext<HospitalHub> _hub;

    public LabService(ILabOrderRepository repo, IHubContext<HospitalHub> hub)
    {
        _repo = repo;
        _hub = hub;
    }

    public async Task<List<LabOrder>> GetAllAsync() => await _repo.GetAllAsync();

    public async Task<LabOrder?> GetByIdAsync(int id) => await _repo.GetByIdAsync(id);

    public async Task<List<LabOrder>> GetPendingAsync() => await _repo.GetPendingAsync();

    public async Task<List<LabOrder>> GetByPatientAsync(int patientId) => await _repo.GetByPatientIdAsync(patientId);

    public async Task<LabOrder> OrderTestAsync(int patientId, int doctorId, int labTestId, int? appointmentId)
    {
        var order = new LabOrder
        {
            PatientId = patientId,
            DoctorId = doctorId,
            LabTestId = labTestId,
            AppointmentId = appointmentId,
            Status = "Pending",
            OrderedAt = DateTime.UtcNow
        };
        return await _repo.AddAsync(order);
    }

    public async Task UploadResultAsync(int orderId, string resultValue, string? notes, bool isAbnormal)
    {
        var order = await _repo.GetByIdAsync(orderId)
            ?? throw new Exception("Lab order not found");

        order.Status = "ResultReady";
        order.ResultValue = resultValue;
        order.ResultNotes = notes;

        await _repo.UpdateAsync(order);

        // SignalR — notify patient their result is ready
        await _hub.Clients.Group($"user_{order.PatientId}")
            .SendAsync("LabResultReady", new
            {
                OrderId = orderId,
                Message = "Your lab result is ready. Please check.",
                IsAbnormal = isAbnormal
            });
    }
}
