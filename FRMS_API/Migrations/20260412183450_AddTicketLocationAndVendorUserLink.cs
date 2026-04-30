using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FRMS_API.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketLocationAndVendorUserLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "VendorID",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "FacilityRequests",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "FacilityRequests",
                type: "varchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ResolutionNotes",
                table: "FacilityRequests",
                type: "varchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_VendorID",
                table: "Users",
                column: "VendorID");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Vendors_VendorID",
                table: "Users",
                column: "VendorID",
                principalTable: "Vendors",
                principalColumn: "VendorID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Vendors_VendorID",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_VendorID",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "VendorID",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "FacilityRequests");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "FacilityRequests");

            migrationBuilder.DropColumn(
                name: "ResolutionNotes",
                table: "FacilityRequests");
        }
    }
}
