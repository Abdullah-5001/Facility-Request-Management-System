import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  AlertCircle,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
} from "lucide-react";
import { ticketService } from "../services/ticketService";

export default function VendorCreationModal({ isOpen, onClose, onCreated }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const [vendor, setVendor] = useState({
    companyName: "",
    contactPerson: "",
    phoneNumber: "",
    email: "",
  });

  const [user, setUser] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    setIsSubmitting(false);
    setShowSuccess(false);
    setError("");
    setVendor({
      companyName: "",
      contactPerson: "",
      phoneNumber: "",
      email: "",
    });
    setUser({ fullName: "", email: "", password: "" });
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError("");

    if (!vendor.companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    if (!user.fullName.trim() || !user.email.trim() || !user.password) {
      setError("Vendor user full name, email, and password are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const createdVendor = await ticketService.createVendor({
        companyName: vendor.companyName.trim(),
        contactPerson: vendor.contactPerson.trim(),
        phoneNumber: vendor.phoneNumber.trim(),
        email: vendor.email.trim(),
      });

      const vendorId = createdVendor?.vendorID ?? createdVendor?.VendorID;
      if (!vendorId) {
        throw new Error("Vendor created but VendorID was missing in response.");
      }

      await ticketService.createVendorUser(vendorId, {
        fullName: user.fullName.trim(),
        email: user.email.trim(),
        password: user.password,
      });

      setShowSuccess(true);

      if (typeof onCreated === "function") {
        onCreated();
      }

      window.setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1800);
    } catch (err) {
      setError(err?.message || "Failed to create vendor.");
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
      aria-label="Add Vendor"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key="vendor-creation-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="bg-[#0B2545] p-6 text-white flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-2xl font-bold">Add Vendor</h2>
              <p className="text-blue-200 text-sm mt-1">
                Create a vendor record and login user.
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
            <div className="p-12 flex flex-col items-center justify-center text-center h-80">
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
                Vendor Created!
              </h3>
              <p className="text-gray-500">
                The vendor now appears in the dispatch dropdown.
              </p>
            </div>
          ) : (
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

              <div className="mb-6">
                <h3 className="text-sm font-bold text-[#0B2545] mb-3">
                  Vendor Details
                </h3>

                <label className="block text-sm font-bold text-[#0B2545] mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="relative mb-4">
                  <Building2
                    className="absolute left-3 top-3.5 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    required
                    maxLength={150}
                    placeholder="e.g., ABC Maintenance"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700"
                    value={vendor.companyName}
                    onChange={(e) =>
                      setVendor((p) => ({ ...p, companyName: e.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#0B2545] mb-2">
                      Contact Person
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-3.5 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        maxLength={100}
                        placeholder="Optional"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700"
                        value={vendor.contactPerson}
                        onChange={(e) =>
                          setVendor((p) => ({
                            ...p,
                            contactPerson: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#0B2545] mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3 top-3.5 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        maxLength={50}
                        placeholder="Optional"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700"
                        value={vendor.phoneNumber}
                        onChange={(e) =>
                          setVendor((p) => ({
                            ...p,
                            phoneNumber: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-[#0B2545] mb-2">
                      Vendor Email
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-3.5 text-gray-400"
                        size={18}
                      />
                      <input
                        type="email"
                        maxLength={150}
                        placeholder="Optional"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700"
                        value={vendor.email}
                        onChange={(e) =>
                          setVendor((p) => ({ ...p, email: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-bold text-[#0B2545] mb-3">
                  Vendor Login User
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#0B2545] mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-3 top-3.5 text-gray-400"
                        size={18}
                      />
                      <input
                        type="text"
                        required
                        maxLength={100}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700"
                        value={user.fullName}
                        onChange={(e) =>
                          setUser((p) => ({ ...p, fullName: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#0B2545] mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-3.5 text-gray-400"
                        size={18}
                      />
                      <input
                        type="email"
                        required
                        maxLength={150}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700"
                        value={user.email}
                        onChange={(e) =>
                          setUser((p) => ({ ...p, email: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-[#0B2545] mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-3.5 text-gray-400"
                        size={18}
                      />
                      <input
                        type="password"
                        required
                        minLength={6}
                        maxLength={100}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700"
                        value={user.password}
                        onChange={(e) =>
                          setUser((p) => ({ ...p, password: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

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
                    <span className="animate-pulse">Creating...</span>
                  ) : (
                    <>Create Vendor</>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
