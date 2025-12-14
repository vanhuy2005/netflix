import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { login, signup } from "../../config/firebase";
import NetflixSpinner from "../../components/common/NetflixSpinner";
import { toast } from "react-toastify";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromLanding = location.state?.email || "";

  const [signState, setSignState] = useState("Sign In");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(emailFromLanding);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();

    // Validation
    if (signState === "Sign Up") {
      if (!name.trim()) {
        toast.error("Vui lòng nhập tên của bạn");
        return;
      }
      if (name.trim().length < 2) {
        toast.error("Tên phải có ít nhất 2 ký tự");
        return;
      }
    }

    if (!email.trim()) {
      toast.error("Vui lòng nhập email");
      return;
    }

    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    try {
      if (signState === "Sign In") {
        await login(email, password);
        navigate("/browse");
      } else {
        await signup(name, email, password);
        navigate("/browse");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      // Error already handled by firebase.js with toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <NetflixSpinner />}

      <div className="min-h-screen relative">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="/assets/background_banner.jpg"
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        {/* Header */}
        <header className="relative z-10 px-8 md:px-16 py-6">
          <img
            src="/assets/logo.png"
            alt="Netflix"
            className="h-8 md:h-12 cursor-pointer"
            onClick={() => navigate("/")}
          />
        </header>

        {/* Login Form */}
        <div className="relative z-10 flex items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-black/75 backdrop-blur-sm rounded-lg p-8 md:p-16 w-full max-w-md"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
              {signState}
            </h1>

            <form onSubmit={handleAuth} className="space-y-6">
              {signState === "Sign Up" && (
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="peer w-full bg-[#333] text-white px-5 pt-6 pb-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white transition-all"
                    placeholder=" "
                    required
                  />
                  <label className="absolute left-5 top-4 text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs">
                    Tên của bạn
                  </label>
                </div>
              )}

              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer w-full bg-[#333] text-white px-5 pt-6 pb-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white transition-all"
                  placeholder=" "
                  required
                />
                <label className="absolute left-5 top-4 text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs">
                  Email hoặc số điện thoại
                </label>
              </div>

              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full bg-[#333] text-white px-5 pt-6 pb-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white transition-all"
                  placeholder=" "
                  required
                  minLength="6"
                />
                <label className="absolute left-5 top-4 text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs">
                  Mật khẩu
                </label>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="w-full bg-netflix-red hover:bg-netflix-redHover text-white font-bold py-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signState}
              </motion.button>

              {signState === "Sign In" && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mr-2 accent-netflix-red"
                    />
                    <span>Ghi nhớ tôi</span>
                  </label>
                  <a href="#" className="text-gray-400 hover:underline">
                    Bạn cần trợ giúp?
                  </a>
                </div>
              )}
            </form>

            <div className="mt-8 text-gray-400">
              {signState === "Sign In" ? (
                <p>
                  Bạn mới sử dụng Netflix?{" "}
                  <button
                    onClick={() => setSignState("Sign Up")}
                    className="text-white font-semibold hover:underline"
                  >
                    Đăng ký ngay
                  </button>
                  .
                </p>
              ) : (
                <p>
                  Đã có tài khoản?{" "}
                  <button
                    onClick={() => setSignState("Sign In")}
                    className="text-white font-semibold hover:underline"
                  >
                    Đăng nhập ngay
                  </button>
                  .
                </p>
              )}
            </div>

            <p className="mt-6 text-xs text-gray-400 leading-relaxed">
              Trang này được Google reCAPTCHA bảo vệ để đảm bảo bạn không phải
              là robot.{" "}
              <a href="#" className="text-blue-500 hover:underline">
                Tìm hiểu thêm
              </a>
              .
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
