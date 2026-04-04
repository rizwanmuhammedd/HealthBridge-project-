using FluentValidation;
using HospitalMS.PatientService.Application.DTOs;

namespace HospitalMS.PatientService.Application.Validators;

public class BookAppointmentValidator : AbstractValidator<BookAppointmentDto>
{
    public BookAppointmentValidator()
    {
        RuleFor(x => x.DoctorId)
            .GreaterThan(0).WithMessage("Valid doctor is required");

        RuleFor(x => x.AppointmentDate)
            .GreaterThan(DateOnly.FromDateTime(DateTime.Today))
            .WithMessage("Appointment must be a future date");

        RuleFor(x => x.ChiefComplaint)
            .MaximumLength(500);
    }
}
