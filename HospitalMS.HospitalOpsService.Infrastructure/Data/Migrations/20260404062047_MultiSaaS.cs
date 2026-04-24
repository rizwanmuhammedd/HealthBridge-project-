using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HospitalMS.HospitalOpsService.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class MultiSaaS : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Bills",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BillNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    PatientId = table.Column<int>(type: "int", nullable: false),
                    AdmissionId = table.Column<int>(type: "int", nullable: true),
                    ConsultationCharge = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    MedicineCharge = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    LabCharge = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    BedCharge = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    OtherCharges = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Discount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    PaidAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    BalanceAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    PaymentStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    PaymentMethod = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    InsuranceProvider = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    InsuranceClaimNumber = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    GeneratedByUserId = table.Column<int>(type: "int", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Bills__3214EC070B0DB671", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Medicines",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    GenericName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Manufacturer = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    StockQuantity = table.Column<int>(type: "int", nullable: false),
                    MinimumStockLevel = table.Column<int>(type: "int", nullable: false, defaultValue: 10),
                    UnitPrice = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    ExpiryDate = table.Column<DateOnly>(type: "date", nullable: true),
                    BatchNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TenantId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Medicine__3214EC07FBCA73A6", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Prescriptions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PatientId = table.Column<int>(type: "int", nullable: false),
                    DoctorId = table.Column<int>(type: "int", nullable: false),
                    AppointmentId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "Pending"),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PrescribedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(getutcdate())"),
                    DispensingAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DispensingPharmacistId = table.Column<int>(type: "int", nullable: true),
                    TenantId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Prescrip__3214EC07A26E7D11", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PrescriptionItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrescriptionId = table.Column<int>(type: "int", nullable: false),
                    MedicineId = table.Column<int>(type: "int", nullable: false),
                    Dosage = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Frequency = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DurationDays = table.Column<int>(type: "int", nullable: false),
                    QuantityToDispense = table.Column<int>(type: "int", nullable: false),
                    Instructions = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    TenantId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__Prescrip__3214EC07EB27D3AD", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrescItems_Medicine",
                        column: x => x.MedicineId,
                        principalTable: "Medicines",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PrescItems_Prescription",
                        column: x => x.PrescriptionId,
                        principalTable: "Prescriptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bills_BillNumber",
                table: "Bills",
                column: "BillNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PrescriptionItems_MedicineId",
                table: "PrescriptionItems",
                column: "MedicineId");

            migrationBuilder.CreateIndex(
                name: "IX_PrescriptionItems_PrescriptionId",
                table: "PrescriptionItems",
                column: "PrescriptionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Bills");

            migrationBuilder.DropTable(
                name: "PrescriptionItems");

            migrationBuilder.DropTable(
                name: "Medicines");

            migrationBuilder.DropTable(
                name: "Prescriptions");
        }
    }
}
