using Microsoft.AspNetCore.Http;

namespace HospitalMS.AuthService.Application.Interfaces;

public interface IImageService
{
    Task<string> UploadImageAsync(IFormFile file, string folder);
}
