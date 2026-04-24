using HospitalMS.NotificationService.Application.Hubs;
using HospitalMS.NotificationService.Application.Interfaces;
using HospitalMS.NotificationService.Application.Services;
using HospitalMS.NotificationService.Domain.Interfaces;
using HospitalMS.NotificationService.Infrastructure.Data;
using HospitalMS.NotificationService.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ■■ 1. Database ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
builder.Services.AddDbContext<NotificationDbContext>(o =>
    o.UseSqlServer(builder.Configuration.GetConnectionString("NotificationDb")));

// ■■ 2. JWT Authentication ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
var jwtKey = builder.Configuration["JwtSettings:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
            NameClaimType = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        };
        
        // SignalR sends token in query string, not header
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context => {
                var token = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(token) && path.StartsWithSegments("/hubs"))
                    context.Token = token;
                return Task.CompletedTask;
            }
        };
    });

// ■■ 3. Dependency Injection ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
builder.Services.AddHttpClient();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IChatRepository, ChatRepository>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantProvider, TenantProvider>();

// ■■ 4. SignalR ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
builder.Services.AddSignalR();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAuthorization();

// ■■ 5. CORS ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■
builder.Services.AddCors(o => o.AddPolicy("AllowReact", p =>
    p.WithOrigins("http://localhost:5173", "http://localhost:5175", "http://localhost:5176")
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));

var app = builder.Build();

app.UseMiddleware<HospitalMS.NotificationService.API.Middleware.ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReact");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<HospitalHub>("/hubs/hospital");

app.Run();
