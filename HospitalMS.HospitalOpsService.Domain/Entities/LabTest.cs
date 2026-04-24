// HospitalMS.HospitalOpsService.Domain/Entities/LabTest.cs
using System;
using System.Collections.Generic;

namespace HospitalMS.HospitalOpsService.Domain.Entities;

public partial class LabTest
{
    public int Id { get; set; }

    public string TestName { get; set; } = null!;

    public string Category { get; set; } = null!;

    public decimal Price { get; set; }

    public string SampleType { get; set; } = null!;

    public int TurnaroundHours { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<LabOrder> LabOrders { get; set; } = new List<LabOrder>();

    public int TenantId { get; set; }
}
