using HospitalMS.AuthService.Application.DTOs;

namespace HospitalMS.AuthService.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
    Task<string> RegisterAsync(RegisterRequestDto request);
    Task<AuthResponseDto> RefreshAsync(RefreshTokenDto dto);
    Task LogoutAsync(int userId);
    Task ForgotPasswordAsync(ForgotPasswordDto dto);
    Task ResetPasswordAsync(ResetPasswordDto dto);
    Task ChangePasswordAsync(int userId, ChangePasswordDto dto);
    Task UpdateProfileImageAsync(int userId, string imageUrl);
}