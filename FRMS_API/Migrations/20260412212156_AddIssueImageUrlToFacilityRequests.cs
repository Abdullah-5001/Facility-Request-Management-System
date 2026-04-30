using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FRMS_API.Migrations
{
    /// <inheritdoc />
    public partial class AddIssueImageUrlToFacilityRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IssueImageUrl",
                table: "FacilityRequests",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IssueImageUrl",
                table: "FacilityRequests");
        }
    }
}
