import { motion } from "motion/react";
import {
  ClipboardList,
  UserCog,
  CheckCircle2,
  Clock,
  Building2,
  Activity,
  GraduationCap,
  Users,
  Wrench,
  Settings,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";

export default function LandingPage() {
  usePageTitle("Home");
  const navigate = useNavigate();

  const heroImageSrc = `${import.meta.env.BASE_URL}campus.png`;

  // Security/SQA: single unified authentication gateway.
  // All role cards MUST route to /login (RBAC happens after auth).
  const goLogin = ({ portal, allowSignup, mode } = {}) => {
    const params = new URLSearchParams();
    if (portal) params.set("portal", portal);
    if (allowSignup) params.set("allowSignup", "1");
    if (mode) params.set("mode", mode);
    const qs = params.toString();
    navigate(qs ? `/login?${qs}` : "/login");
  };

  return (
    <div
      id="home"
      className="min-h-screen bg-white"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Sticky Navigation Bar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 bg-[#0B2545] shadow-md"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => {
              const el = document.getElementById("home");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <div className="w-10 h-10 bg-[#F26419] rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl">
              PTUT Facility Portal
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#home"
              className="text-white hover:text-[#F26419] transition-colors"
            >
              Home
            </a>
            <a
              href="#track"
              className="text-white hover:text-[#F26419] transition-colors"
            >
              Track Ticket
            </a>
            <a
              href="#help"
              className="text-white hover:text-[#F26419] transition-colors"
            >
              Help
            </a>

            {/* Requestor-only signup CTA + shared login */}
            <div className="flex items-center gap-4 border-l border-gray-600 pl-8">
              <button
                type="button"
                onClick={() =>
                  goLogin({
                    portal: "Requester",
                    allowSignup: true,
                    mode: "signup",
                  })
                }
                className="text-white font-medium hover:text-[#F26419] transition-colors"
              >
                Requestor Sign Up
              </button>
              <button
                type="button"
                onClick={() => goLogin({ mode: "login" })}
                className="bg-[#F26419] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#d95714] transition-all hover:shadow-lg"
              >
                Login Portal
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImageSrc}
            alt="PTUT Campus"
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-linear-to-r from-white/95 via-white/90 to-white/70" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-[#0B2545] leading-tight mb-6">
              Streamline Campus Maintenance at PTUT.
            </h1>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              The fast, transparent, and trackable way for requestors to report
              facility issues.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() =>
                  goLogin({
                    portal: "Requester",
                    allowSignup: true,
                    mode: "login",
                  })
                }
                className="bg-[#F26419] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#d95714] transition-all hover:shadow-xl hover:scale-105"
              >
                Submit a Request
              </button>
              <button
                onClick={() =>
                  goLogin({
                    portal: "Requester",
                    allowSignup: true,
                    mode: "signup",
                  })
                }
                className="border-2 border-[#0B2545] text-[#0B2545] px-8 py-4 rounded-lg font-semibold hover:bg-[#0B2545] hover:text-white transition-all"
              >
                Register Account
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden md:block"
          >
            <div className="relative">
              <img
                src={heroImageSrc}
                alt="PTUT Campus"
                className="rounded-2xl shadow-2xl"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Statistics / Trust Banner */}
      <section id="track" className="bg-[#F8F9FA] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-4"
            >
              <div className="w-16 h-16 bg-[#F26419] rounded-lg flex items-center justify-center shrink-0">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#0B2545]">24/7</div>
                <div className="text-gray-600">Ticketing Available</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-4"
            >
              <div className="w-16 h-16 bg-[#F26419] rounded-lg flex items-center justify-center shrink-0">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#0B2545]">4</div>
                <div className="text-gray-600">Dedicated Departments</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center gap-4"
            >
              <div className="w-16 h-16 bg-[#F26419] rounded-lg flex items-center justify-center shrink-0">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#0B2545]">
                  Real-time
                </div>
                <div className="text-gray-600">Issue Tracking</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - 3 Step Process */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-[#0B2545] mb-4">
              Resolving Issues in Three Simple Steps
            </h2>
            <p className="text-xl text-gray-600">
              From submission to resolution, we've streamlined the process
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-[#F8F9FA] p-8 rounded-xl hover:shadow-lg transition-shadow"
            >
              <div className="w-20 h-20 bg-[#0B2545] rounded-xl flex items-center justify-center mb-6">
                <ClipboardList className="w-10 h-10 text-white" />
              </div>
              <div className="text-[#F26419] font-bold mb-2">STEP 1</div>
              <h3 className="text-2xl font-bold text-[#0B2545] mb-3">Submit</h3>
              <p className="text-gray-600">
                Report your facility issue through our easy-to-use form with
                detailed descriptions.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[#F8F9FA] p-8 rounded-xl hover:shadow-lg transition-shadow"
            >
              <div className="w-20 h-20 bg-[#0B2545] rounded-xl flex items-center justify-center mb-6">
                <UserCog className="w-10 h-10 text-white" />
              </div>
              <div className="text-[#F26419] font-bold mb-2">STEP 2</div>
              <h3 className="text-2xl font-bold text-[#0B2545] mb-3">Assign</h3>
              <p className="text-gray-600">
                Requests are routed to the appropriate department and approved
                by the Department Head.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-[#F8F9FA] p-8 rounded-xl hover:shadow-lg transition-shadow"
            >
              <div className="w-20 h-20 bg-[#F26419] rounded-xl flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <div className="text-[#F26419] font-bold mb-2">STEP 3</div>
              <h3 className="text-2xl font-bold text-[#0B2545] mb-3">
                Resolve
              </h3>
              <p className="text-gray-600">
                Track progress in real-time and receive updates when issues are
                resolved.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Access Portals - Role-Based Cards */}
      <section className="py-20 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-[#0B2545] mb-4">
              Dedicated Portals for Every Role
            </h2>
            <p className="text-xl text-gray-600">
              Customized experiences designed for your specific needs
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
              transition={{ duration: 0.3 }}
              onClick={() =>
                goLogin({
                  portal: "Requester",
                  allowSignup: true,
                  mode: "login",
                })
              }
              className="bg-white p-8 rounded-xl shadow-md cursor-pointer border-2 border-transparent hover:border-[#F26419] text-left"
            >
              <div className="w-16 h-16 bg-[#0B2545] rounded-xl flex items-center justify-center mb-6">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#0B2545] mb-3">
                Requestors
              </h3>
              <p className="text-gray-600 mb-4">
                Submit requests, track tickets, and receive updates on facility
                issues affecting your learning environment.
              </p>
              <div className="text-[#F26419] font-semibold flex items-center gap-2">
                Access Portal →
              </div>
            </motion.button>

            <motion.button
              type="button"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
              transition={{ duration: 0.3 }}
              onClick={() => goLogin({ portal: "DeptHead", mode: "login" })}
              className="bg-white p-8 rounded-xl shadow-md cursor-pointer border-2 border-transparent hover:border-[#F26419] text-left"
            >
              <div className="w-16 h-16 bg-[#0B2545] rounded-xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#0B2545] mb-3">
                Department Heads
              </h3>
              <p className="text-gray-600 mb-4">
                Review, prioritize, and approve or reject department requests.
              </p>
              <div className="text-[#F26419] font-semibold flex items-center gap-2">
                Access Portal →
              </div>
            </motion.button>

            <motion.button
              type="button"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
              transition={{ duration: 0.3 }}
              onClick={() => goLogin({ portal: "Vendor", mode: "login" })}
              className="bg-white p-8 rounded-xl shadow-md cursor-pointer border-2 border-transparent hover:border-[#F26419] text-left"
            >
              <div className="w-16 h-16 bg-[#0B2545] rounded-xl flex items-center justify-center mb-6">
                <Wrench className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#0B2545] mb-3">
                Maintenance Vendors
              </h3>
              <p className="text-gray-600 mb-4">
                View assigned tasks and update tickets to completed with
                resolution notes.
              </p>
              <div className="text-[#F26419] font-semibold flex items-center gap-2">
                Access Portal →
              </div>
            </motion.button>

            <motion.button
              type="button"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
              transition={{ duration: 0.3 }}
              onClick={() => goLogin({ portal: "Admin", mode: "login" })}
              className="bg-white p-8 rounded-xl shadow-md cursor-pointer border-2 border-transparent hover:border-[#F26419] text-left"
            >
              <div className="w-16 h-16 bg-[#0B2545] rounded-xl flex items-center justify-center mb-6">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#0B2545] mb-3">
                System Admins
              </h3>
              <p className="text-gray-600 mb-4">
                Full system control, ticket dispatch, and vendor management.
              </p>
              <div className="text-[#F26419] font-semibold flex items-center gap-2">
                Access Portal →
              </div>
            </motion.button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="help" className="bg-[#0B2545] text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#F26419] rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl">PTUT FRMS</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                The Facility Request Management System streamlines campus
                maintenance for the PTUT community with real-time tracking.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <button
                    type="button"
                    onClick={() => goLogin({ mode: "login" })}
                    className="text-gray-300 hover:text-[#F26419] transition-colors"
                  >
                    Login Portal
                  </button>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-gray-300 hover:text-[#F26419] transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-gray-300 hover:text-[#F26419] transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">IT Support Helpdesk</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#F26419]" />
                  <span className="text-gray-300">support@ptut.edu</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#F26419]" />
                  <span className="text-gray-300">+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#F26419]" />
                  <span className="text-gray-300">IT Building, Room 201</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p>
              © {new Date().getFullYear()} PTUT Facility Request Management
              System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
