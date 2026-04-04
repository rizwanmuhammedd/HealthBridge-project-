using HospitalMS.AuthService.Domain.Interfaces;
using HospitalMS.AuthService.Domain.Entities;
using HospitalMS.AuthService.Application.Interfaces;
using HospitalMS.AuthService.Application.DTOs;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace HospitalMS.AuthService.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepo;
    private readonly IConfiguration _config;

    public AuthService(IUserRepository userRepo, IConfiguration config)
    {
        _userRepo = userRepo;
        _config = config;
    }

    public async Task<string> RegisterAsync(RegisterRequestDto dto)
    {
        var existing = await _userRepo.GetByEmailAsync(dto.Email);
        if (existing != null)
            return "User already exists";

        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "Patient", // Always default to Patient for public registration
            Phone = string.IsNullOrEmpty(dto.Phone) ? "0000000000" : dto.Phone
        };

        await _userRepo.AddUserAsync(user);
        return "Registered successfully";
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto dto)
    {
        var user = await _userRepo.GetByEmailAsync(dto.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new Exception("Invalid email or password");

        var response = BuildResponse(user);
        await _userRepo.UpdateAsync(user);
        return response;
    }

    public async Task<AuthResponseDto> RefreshAsync(RefreshTokenDto dto)
    {
        var principal = GetPrincipalFromExpiredToken(dto.AccessToken);
        var userIdStr = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userIdStr == null) throw new Exception("Invalid token");

        var user = await _userRepo.GetByIdAsync(int.Parse(userIdStr));
        if (user == null || user.RefreshToken != dto.RefreshToken)
            throw new Exception("Invalid refresh token");

        if (user.RefreshTokenExpiry < DateTime.UtcNow)
            throw new Exception("Refresh token expired — please login again");

        var response = BuildResponse(user);
        await _userRepo.UpdateAsync(user);
        return response;
    }

    public async Task LogoutAsync(int userId)
    {
        var user = await _userRepo.GetByIdAsync(userId);
        if (user != null)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            await _userRepo.UpdateAsync(user);
        }
    }

    public async Task ForgotPasswordAsync(ForgotPasswordDto dto)
    {
        var user = await _userRepo.GetByEmailAsync(dto.Email.ToLower());
        if (user == null) return;

        var token = new Random().Next(100000, 999999).ToString();
        var expiry = DateTime.UtcNow.AddMinutes(15);

        user.PasswordResetToken = token;
        user.PasswordResetExpiry = expiry;
        await _userRepo.UpdateAsync(user);

        // TODO: Send email with token
        Console.WriteLine($"Password reset token for {dto.Email}: {token}");
    }

    public async Task ResetPasswordAsync(ResetPasswordDto dto)
    {
        var user = await _userRepo.GetByEmailAsync(dto.Email.ToLower());
        if (user == null) throw new Exception("User not found");

        if (user.PasswordResetToken != dto.Token)
            throw new Exception("Invalid reset token");

        if (user.PasswordResetExpiry < DateTime.UtcNow)
            throw new Exception("Reset token has expired");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepo.UpdateAsync(user);
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordDto dto)
    {
        var user = await _userRepo.GetByIdAsync(userId);
        if (user == null) throw new Exception("User not found");

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            throw new Exception("Current password is incorrect");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _userRepo.UpdateAsync(user);
    }

    public async Task UpdateProfileImageAsync(int userId, string imageUrl)
    {
        var user = await _userRepo.GetByIdAsync(userId);
        if (user != null)
        {
            user.ProfileImageUrl = imageUrl;
            await _userRepo.UpdateAsync(user);
        }
    }

    private AuthResponseDto BuildResponse(User user)
    {
        var token = GenerateJwtToken(user);
        var refresh = GenerateRefreshToken();
        var expiryHours = double.Parse(_config["JwtSettings:ExpiryInHours"] ?? "24");
        var expiry = DateTime.UtcNow.AddHours(expiryHours);

        user.RefreshToken = refresh;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);

        return new AuthResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            TenantId = user.TenantId,
            Token = token,
            RefreshToken = refresh,
            TokenExpiry = expiry
        };
    }

    private string GenerateJwtToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("TenantId", user.TenantId.ToString()),
            new Claim("FullName", user.FullName)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var expiryHours = double.Parse(_config["JwtSettings:ExpiryInHours"] ?? "24");

        var token = new JwtSecurityToken(
            issuer: _config["JwtSettings:Issuer"],
            audience: _config["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expiryHours),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:Key"]!));
        var validation = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = false
        };

        return new JwtSecurityTokenHandler().ValidateToken(token, validation, out _);
    }
}
