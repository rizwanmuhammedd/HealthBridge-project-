using FluentValidation;
using HospitalMS.AuthService.Application.DTOs;

namespace HospitalMS.AuthService.Application.Validators;

public class RegisterValidator : AbstractValidator<RegisterRequestDto>
{
    public RegisterValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required")
            .MaximumLength(100);

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Enter a valid email address");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters")
            .Matches("[A-Z]").WithMessage("Password must have at least one uppercase letter")
            .Matches("[0-9]").WithMessage("Password must have at least one number");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone is required")
            .Length(10, 15).WithMessage("Phone must be 10-15 digits");

        RuleFor(x => x.DateOfBirth)
            .NotEmpty().WithMessage("Date of birth is required");
            
        // Role is optional in the DTO now as it's hardcoded to 'Patient' in the service
    }
}
