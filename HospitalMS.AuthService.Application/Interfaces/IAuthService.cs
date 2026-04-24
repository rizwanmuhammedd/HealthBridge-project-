using HospitalMS.AuthService.Application.DTOs;
using HospitalMS.AuthService.Domain.Entities;

namespace HospitalMS.AuthService.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
    Task<string> RegisterAsync(RegisterRequestDto request);
    Task<User> CreateStaffAsync(RegisterRequestDto request);
    Task<List<User>> GetAllUsersAsync();
    Task<List<User>> GetUsersByRoleAsync(string role);
    Task<AuthResponseDto> RefreshAsync(RefreshTokenDto dto);
    Task LogoutAsync(int userId);
    Task ForgotPasswordAsync(ForgotPasswordDto dto);
    Task ResetPasswordAsync(ResetPasswordDto dto);
    Task ChangePasswordAsync(int userId, ChangePasswordDto dto);
    Task UpdateProfileImageAsync(int userId, string imageUrl);
    Task DeactivateUserAsync(int userId);
    Task RestoreUserAsync(int userId);
    Task<AuthResponseDto> LoginWithGoogleAsync(GoogleLoginRequestDto dto);
}