using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using HospitalMS.AuthService.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace HospitalMS.AuthService.Application.Services;

public class ImageService : IImageService
{
    private readonly Cloudinary _cloudinary;

    public ImageService(IConfiguration config)
    {
        var acc = new Account(
            config["Cloudinary:CloudName"],
            config["Cloudinary:ApiKey"],
            config["Cloudinary:ApiSecret"]
        );
        _cloudinary = new Cloudinary(acc);
    }

    public async Task<string> UploadImageAsync(IFormFile file, string folder)
    {
        if (file.Length <= 0) return string.Empty;

        using var stream = file.OpenReadStream();
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(file.FileName, stream),
            Folder = folder,
            Transformation = new Transformation().Height(500).Width(500).Crop("fill")
        };

        var result = await _cloudinary.UploadAsync(uploadParams);
        
        if (result.Error != null)
        {
            throw new Exception($"Cloudinary Upload Error: {result.Error.Message}");
        }

        return result.SecureUrl?.ToString() ?? string.Empty;
    }
}
