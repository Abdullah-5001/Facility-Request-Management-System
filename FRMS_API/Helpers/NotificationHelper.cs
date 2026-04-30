using FRMS_API.Models;
using System.Diagnostics;

namespace FRMS_API.Helpers
{
    public class NotificationHelper
    {
        private readonly IConfiguration _configuration;

        public NotificationHelper(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        // This method handles the complex business logic of who gets notified
        public void SendNewRequestAlert(FacilityRequest request, string deptHeadEmail)
        {
            // The core workflow rules you established:
            string ccDean = _configuration["Notifications:Cc:DeanEmail"] ?? "dean@university.edu.pk";
            string ccVC = _configuration["Notifications:Cc:VcEmail"] ?? "vc@university.edu.pk";
            string ccDeputyRegistrar = _configuration["Notifications:Cc:DeputyRegistrarEmail"] ?? "deputyregistrar@university.edu.pk";

            string subject = $"New Facility Request: {request.Title} - Routing to {request.Department?.Name ?? "Unknown Department"}";
            
            string body = $@"
                A new facility request has been submitted.
                Requester ID: {request.RequesterID}
                Title: {request.Title}
                Description: {request.Description}

                This has been assigned to the Department Head for processing.
            ";

            // For now, we simulate sending the email in the Output console
            Debug.WriteLine("=== EMAIL SENT ===");
            Debug.WriteLine($"TO: {deptHeadEmail}");
            Debug.WriteLine($"CC: {ccDean}, {ccVC}, {ccDeputyRegistrar}");
            Debug.WriteLine($"SUBJECT: {subject}");
            Debug.WriteLine($"BODY: {body}");
            Debug.WriteLine("==================");
        }

        // Optional notification triggered when a vendor completes a ticket
        public void SendRequestCompletedAlert(FacilityRequest request)
        {
            string subject = $"Facility Request Completed: {request.Title}";

            string body = $@"
                A facility request has been completed.
                Request ID: {request.RequestID}
                Title: {request.Title}
                Status: {request.Status}
                Completed At: {request.CompletedAt:O}
            ";

            Debug.WriteLine("=== EMAIL SENT (SIMULATED) ===");
            Debug.WriteLine("TO: (requestor + admin)");
            Debug.WriteLine($"SUBJECT: {subject}");
            Debug.WriteLine($"BODY: {body}");
            Debug.WriteLine("==============================");
        }
    }
}
