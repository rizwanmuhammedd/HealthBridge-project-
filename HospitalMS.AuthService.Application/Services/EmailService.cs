using System.Net;
using System.Net.Mail;
using HospitalMS.AuthService.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace HospitalMS.AuthService.Application.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        var smtpServer = _config["SmtpSettings:Server"];
        var smtpPort = int.Parse(_config["SmtpSettings:Port"] ?? "587");
        var senderName = _config["SmtpSettings:SenderName"];
        var senderEmail = _config["SmtpSettings:SenderEmail"];
        var username = _config["SmtpSettings:Username"];
        var password = _config["SmtpSettings:Password"];

        try
        {
            using var client = new SmtpClient(smtpServer, smtpPort)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail!, senderName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            mailMessage.To.Add(to);

            await client.SendMailAsync(mailMessage);
            Console.WriteLine($"SUCCESS: Email sent to {to}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERROR: Failed to send email to {to}");
            Console.WriteLine($"Exception: {ex.Message}");
            if (ex.InnerException != null)
                Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
            throw; // Re-throw to let the controller return a BadRequest
        }
    }
}
