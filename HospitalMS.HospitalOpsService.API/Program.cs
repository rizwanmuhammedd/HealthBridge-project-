// HospitalMS.HospitalOpsService.API/Program.cs

using HospitalMS.HospitalOpsService.Application.Interfaces;
using HospitalMS.HospitalOpsService.Application.Services;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using HospitalMS.HospitalOpsService.Infrastructure.Data;
using HospitalMS.HospitalOpsService.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. DbContext
builder.Services.AddHttpContextAccessor();
builder.Services.AddDbContext<HospitalOpsDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("OpsDb")));

// 2. Repositories
builder.Services.AddScoped<ITenantProvider,       TenantProvider>();
builder.Services.AddScoped<IMedicineRepository,     MedicineRepository>();
builder.Services.AddScoped<IPrescriptionRepository, PrescriptionRepository>();
builder.Services.AddScoped<ILabOrderRepository,     LabOrderRepository>();
builder.Services.AddScoped<IBillRepository,         BillRepository>();

// 3. Services
builder.Services.AddScoped<IMedicineService,     MedicineService>();
builder.Services.AddScoped<IPrescriptionService, PrescriptionService>();
builder.Services.AddScoped<ILabService,          LabService>();
builder.Services.AddScoped<IBillService,         BillService>();

// 4. JWT
var jwtKey = builder.Configuration["JwtSettings:Key"];
if (string.IsNullOrEmpty(jwtKey))
{
    throw new Exception("JWT Key is missing in configuration.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer    = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience  = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
            NameClaimType = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        };
    });

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAuthorization();
builder.Services.AddHttpClient();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
