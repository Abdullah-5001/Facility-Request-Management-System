import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Mail,
  Lock,
  User,
  Hash,
  ArrowRight,
  ShieldCheck,
  X,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";
import { authService } from "../services/authService";

export default function Login() {
  usePageTitle("Authentication");

  const { login, register } = useAuth();
  const location = useLocation();

  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const allowSignup = query.get("allowSignup") === "1";
  const mode = query.get("mode") || "login";

  const [isLogin, setIsLogin] = useState(!(allowSignup && mode === "signup"));

  useEffect(() => {
    setIsLogin(!(allowSignup && mode === "signup"));
  }, [allowSignup, mode]);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    fullName: "",
    identifier: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotStatus, setForgotStatus] = useState({ type: "", message: "" });

  const effectiveIsLogin = allowSignup ? isLogin : true;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await login(loginForm.email, loginForm.password);
    } catch (err) {
      setError(
        err?.message ||
          err?.response?.data ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Password and Confirm Password do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        fullName: signupForm.fullName,
        rollNumber: signupForm.identifier,
        email: signupForm.email,
        password: signupForm.password,
        role: "Requester",
      });
      setSuccess("Account created successfully. Please log in.");
      setIsLogin(true);
      setLoginForm((p) => ({ ...p, email: signupForm.email }));
      setSignupForm({
        fullName: "",
        identifier: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(
        err?.message ||
          err?.response?.data ||
          "Registration failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotSubmitting(true);
    setForgotStatus({ type: "", message: "" });

    try {
      const response = await authService.requestPasswordReset(forgotEmail);
      setForgotStatus({
        type: "success",
        message:
          response?.message ||
          "If the email exists, a reset message has been queued.",
      });
    } catch (err) {
      setForgotStatus({
        type: "error",
        message:
          err?.message || "Failed to request password reset. Please retry.",
      });
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F8F9FA] flex"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Left Side - Branding & Information (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-[#0B2545] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-white mix-blend-overlay blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-[#F26419] mix-blend-overlay blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-[#F26419] rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span className="font-bold text-3xl tracking-tight">PTUT FRMS</span>
          </div>

          <h1 className="text-5xl font-bold leading-tight mb-6">
            Secure Campus <br />
            <span className="text-[#F26419]">Maintenance.</span>
          </h1>
          <p className="text-lg text-blue-200 max-w-md leading-relaxed">
            A centralized system for the Punjab Tianjin University of Technology
            community to track, manage, and resolve facility requests.
          </p>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 w-max">
            <ShieldCheck className="text-[#F26419]" size={24} />
            <span className="text-sm font-medium">
              Enterprise-grade RBAC Security
            </span>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#0B2545] mb-2">
              {effectiveIsLogin ? "Welcome Back" : "Create Requestor Account"}
            </h2>
            <p className="text-gray-500">
              {effectiveIsLogin
                ? "Enter your credentials to access your portal."
                : "Requestors can register here. Staff must be added by an Administrator."}
            </p>
          </div>

          {success && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <AnimatePresence mode="wait">
              {effectiveIsLogin ? (
                // --- LOGIN FORM ---
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                  onSubmit={handleLogin}
                >
                  <div>
                    <label className="block text-sm font-bold text-[#0B2545] mb-2">
                      University Email
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-4 top-3 text-gray-400"
                        size={20}
                      />
                      <input
                        type="email"
                        value={loginForm.email}
                        onChange={(e) =>
                          setLoginForm((p) => ({ ...p, email: e.target.value }))
                        }
                        placeholder="rollnumber@ptut.edu.pk"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-bold text-[#0B2545]">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(loginForm.email);
                          setForgotStatus({ type: "", message: "" });
                          setIsForgotOpen(true);
                        }}
                        className="text-xs font-semibold text-[#F26419] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock
                        className="absolute left-4 top-3 text-gray-400"
                        size={20}
                      />
                      <input
                        type="password"
                        value={loginForm.password}
                        onChange={(e) =>
                          setLoginForm((p) => ({
                            ...p,
                            password: e.target.value,
                          }))
                        }
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700"
                        required
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#0B2545] disabled:opacity-60 hover:bg-blue-900 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md mt-6"
                  >
                    Secure Login <ArrowRight size={18} />
                  </button>
                </motion.form>
              ) : (
                // --- SIGN UP FORM ---
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                  onSubmit={handleSignup}
                >
                  <div>
                    <label className="block text-sm font-bold text-[#0B2545] mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-4 top-3 text-gray-400"
                        size={20}
                      />
                      <input
                        type="text"
                        value={signupForm.fullName}
                        onChange={(e) =>
                          setSignupForm((p) => ({
                            ...p,
                            fullName: e.target.value,
                          }))
                        }
                        placeholder="e.g. Khair Muhammad Hamza"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700"
                        required
                        autoComplete="name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#0B2545] mb-2">
                      Roll Number / Employee ID
                    </label>
                    <div className="relative">
                      <Hash
                        className="absolute left-4 top-3 text-gray-400"
                        size={20}
                      />
                      <input
                        type="text"
                        value={signupForm.identifier}
                        onChange={(e) =>
                          setSignupForm((p) => ({
                            ...p,
                            identifier: e.target.value,
                          }))
                        }
                        placeholder="e.g. 24-ST-047"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#0B2545] mb-2">
                      University Email
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-4 top-3 text-gray-400"
                        size={20}
                      />
                      <input
                        type="email"
                        value={signupForm.email}
                        onChange={(e) =>
                          setSignupForm((p) => ({
                            ...p,
                            email: e.target.value,
                          }))
                        }
                        placeholder="requestor@ptut.edu.pk"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-[#0B2545] mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock
                          className="absolute left-3 top-3 text-gray-400"
                          size={18}
                        />
                        <input
                          type="password"
                          value={signupForm.password}
                          onChange={(e) =>
                            setSignupForm((p) => ({
                              ...p,
                              password: e.target.value,
                            }))
                          }
                          placeholder="••••••••"
                          className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700 text-sm"
                          required
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-[#0B2545] mb-2">
                        Confirm
                      </label>
                      <div className="relative">
                        <Lock
                          className="absolute left-3 top-3 text-gray-400"
                          size={18}
                        />
                        <input
                          type="password"
                          value={signupForm.confirmPassword}
                          onChange={(e) =>
                            setSignupForm((p) => ({
                              ...p,
                              confirmPassword: e.target.value,
                            }))
                          }
                          placeholder="••••••••"
                          className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F26419] focus:border-transparent outline-none transition-all text-gray-700 text-sm"
                          required
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#F26419] disabled:opacity-60 hover:bg-[#d95714] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md mt-4"
                  >
                    Register as Requestor
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Toggle Button */}
          {allowSignup && (
            <div className="text-center mt-8">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setIsLogin((v) => !v);
                }}
                className="text-gray-600 font-medium hover:text-[#0B2545] transition-colors"
              >
                {effectiveIsLogin
                  ? "Are you a new requestor? Sign up here."
                  : "Already have an account? Log in."}
              </button>
            </div>
          )}

          <AnimatePresence>
            {isForgotOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 18 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 18 }}
                  className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
                >
                  <div className="flex items-start justify-between bg-[#0B2545] px-6 py-5 text-white">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-blue-200">
                        Account recovery
                      </p>
                      <h3 className="mt-1 text-2xl font-bold">
                        Reset your password
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsForgotOpen(false)}
                      className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Close reset dialog"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form
                    onSubmit={handleForgotPassword}
                    className="space-y-5 p-6"
                  >
                    <p className="text-sm leading-6 text-gray-600">
                      Enter your PTUT email address and we’ll prepare a password
                      reset request. The UI stays usable even while the server
                      reset endpoint is being added.
                    </p>

                    {forgotStatus.message && (
                      <div
                        className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
                          forgotStatus.type === "success"
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        <AlertCircle className="mt-0.5 shrink-0" size={16} />
                        <p>{forgotStatus.message}</p>
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-bold text-[#0B2545]">
                        University Email
                      </label>
                      <div className="relative">
                        <Mail
                          className="absolute left-4 top-3 text-gray-400"
                          size={20}
                        />
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="rollnumber@ptut.edu.pk"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-gray-700 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#F26419]"
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsForgotOpen(false)}
                        className="w-1/3 rounded-xl px-5 py-3 font-bold text-gray-600 transition-colors hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={forgotSubmitting}
                        className="w-2/3 rounded-xl bg-[#F26419] px-5 py-3 font-bold text-white shadow-md transition-all duration-200 hover:bg-[#d95714] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {forgotSubmitting ? "Sending..." : "Send reset request"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
