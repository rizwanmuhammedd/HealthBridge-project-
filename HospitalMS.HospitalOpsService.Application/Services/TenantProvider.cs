using System.Security.Claims;
using HospitalMS.HospitalOpsService.Domain.Interfaces;
using Microsoft.AspNetCore.Http;

namespace HospitalMS.HospitalOpsService.Application.Services;

public class TenantProvider : ITenantProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public int TenantId
    {
        get
        {
            var tenantIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("TenantId");
            if (tenantIdClaim != null && int.TryParse(tenantIdClaim.Value, out int tenantId))
            {
                return tenantId;
            }
            return 1; // Default/fallback tenant
        }
    }
}
