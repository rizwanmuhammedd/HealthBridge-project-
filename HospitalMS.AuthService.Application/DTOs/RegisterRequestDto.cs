namespace HospitalMS.AuthService.Application.DTOs;

public class RegisterRequestDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Role { get; set; }
    public string? Phone { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? Specialization { get; set; }
    public string? Qualification { get; set; }
}
