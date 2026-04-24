namespace HospitalMS.HospitalOpsService.Application.DTOs;

public class RazorpayOrderResponseDto
{
    public string OrderId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "INR";
    public string KeyId { get; set; } = string.Empty;
    public bool IsMedicine { get; set; }
}

public class RazorpayPaymentVerificationDto
{
    public string RazorpayOrderId { get; set; } = string.Empty;
    public string RazorpayPaymentId { get; set; } = string.Empty;
    public string RazorpaySignature { get; set; } = string.Empty;
    public int PrescriptionId { get; set; }
    public bool IsMedicine { get; set; }
}
