import { useEffect, useMemo, useState } from "react";
import {
  X,
  AlertCircle,
  MapPin,
  Tag,
  FileText,
  UploadCloud,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ticketService } from "../services/ticketService";

export default function TicketSubmissionModal({
  isOpen,
  onClose,
  onSubmitted,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    departmentID: "",
    location: "",
    description: "",
  });

  const departments = useMemo(
    () => [
      { id: 1, name: "IT Department" },
      { id: 2, name: "Estate Management" },
      { id: 3, name: "Planning and Development" },
      { id: 4, name: "Academic Department" },
      { id: 5, name: "Quality (QAC) Department" },
      { id: 6, name: "Exam Department" },
    ],
    [],
  );

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setIsSubmitting(false);
    setShowSuccess(false);
    setSelectedFile(null);
    setFormData({
      title: "",
      departmentID: "",
      location: "",
      description: "",
    });
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      setError("Photo must be 5MB or smaller.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await ticketService.createTicket({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        departmentID: parseInt(formData.departmentID),
        photo: selectedFile,
      });

      setShowSuccess(true);

      if (typeof onSubmitted === "function") {
        onSubmitted();
      }

      window.setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(
        err?.message || "Failed to submit the request. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
      style={{ fontFamily: "Inter, sans-serif" }}
      role="dialog"
      aria-modal="true"
      aria-label="Report Facility Issue"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key="ticket-submission-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="bg-[#0B2545] p-6 text-white flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-2xl font-bold">Report Facility Issue</h2>
              <p className="text-blue-200 text-sm mt-1">
                Please provide accurate details to ensure quick resolution.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>

          {showSuccess ? (
            /* Success State */
            <div className="p-12 flex flex-col items-center justify-center text-center h-96">
              <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#0B2545] mb-2">
                Ticket Submitted!
              </h3>
              <p className="text-gray-500">
                Your request has been routed to the department head for
                approval.
              </p>
            </div>
          ) : (
            /* Submission Form */
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-8"
            >
              {error && (
                <div className="mb-6 flex items-start gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {/* Title */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-[#0B2545] mb-2">
                  Issue Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={50}
                    required
                    placeholder="e.g., AC not cooling, Broken Chair"
                    className="w-full pl-4 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, title: e.target.value }))
                    }
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {formData.title.length}/50 characters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Department Dropdown */}
                <div>
                  <label className="block text-sm font-bold text-[#0B2545] mb-2">
                    Category / Department{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag
                      className="absolute left-3 top-3.5 text-gray-400"
                      size={18}
                    />
                    <select
                      required
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700 appearance-none"
                      value={formData.departmentID}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          departmentID: e.target.value,
                        }))
                      }
                    >
                      <option value="" disabled>
                        Select Department...
                      </option>
                      {departments.map((d) => (
                        <option key={d.id} value={String(d.id)}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location Dropdown */}
                <div>
                  <label className="block text-sm font-bold text-[#0B2545] mb-2">
                    Campus Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-3 top-3.5 text-gray-400"
                      size={18}
                    />
                    <select
                      required
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700 appearance-none"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, location: e.target.value }))
                      }
                    >
                      <option value="" disabled>
                        Select Location...
                      </option>
                      <option value="Main Gate">Main Gate</option>
                      <option value="Library">Library</option>
                      <option value="Cafeteria">Cafeteria</option>
                      <option value="Computer Lab 1">Computer Lab 1</option>
                      <option value="Mechanical Lab 2">Mechanical Lab 2</option>
                      <option value="Admin Block">Admin Block</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-[#0B2545] mb-2">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText
                    className="absolute left-3 top-3.5 text-gray-400"
                    size={18}
                  />
                  <textarea
                    required
                    rows="4"
                    maxLength={500}
                    placeholder="Please describe the issue in detail. The more information, the faster we can assign the right vendor..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700 resize-none"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                  ></textarea>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Optional Photo Upload */}
              <div className="mb-8">
                <label className="block text-sm font-bold text-[#0B2545] mb-2">
                  Attach Photo (Optional)
                </label>

                <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-[#F26419] transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedFile(file);
                    }}
                  />
                  <UploadCloud size={32} className="mb-2 text-[#F26419]" />
                  <p className="text-sm font-medium text-[#0B2545]">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs mt-1">
                    SVG, PNG, JPG or GIF (max. 5MB)
                  </p>
                  {selectedFile && (
                    <p className="text-xs mt-3 text-gray-600">
                      Selected:{" "}
                      <span className="font-semibold">{selectedFile.name}</span>
                    </p>
                  )}
                </label>
              </div>

              {/* Submit Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors w-1/3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-[#F26419] hover:bg-[#d95714] transition-colors w-2/3 flex justify-center items-center gap-2 shadow-md disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">Processing...</span>
                  ) : (
                    <>Submit Request</>
                  )}
                </button>
              </div>

              <div className="mt-4 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <p>
                  Submitting false or spam requests may result in your portal
                  access being temporarily suspended.
                </p>
              </div>
            </form>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
