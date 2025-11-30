import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { signup } from "../../config/firebase";
import { toast } from "react-toastify";

const SignupStep3 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = location.state || {};

  const [password, setPassword] = useState("");
  const [doNotEmail, setDoNotEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!email) {
    navigate("/");
    return null;
  }

  const handleNext = async (e) => {
    e.preventDefault();

    if (!password || password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    try {
      // Tạo tài khoản với email và password
      await signup(email.split("@")[0], email, password);

      toast.success("🎉 Tạo tài khoản thành công!");

      // Redirect to browse
      setTimeout(() => {
        navigate("/browse");
      }, 1000);
    } catch (error) {
      console.error("Signup error:", error);
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Skip password creation, just verify email and go to browse
    toast.info("Đăng nhập bằng email link...");
    navigate("/browse");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-8 py-4">
        <img
          src="/assets/logo.png"
          alt="Netflix"
          className="h-10 cursor-pointer"
          onClick={() => navigate("/")}
        />
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 right-8 text-lg font-semibold text-gray-900 hover:underline"
        >
          Sign in
        </button>
      </header>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Step Indicator */}
          <p className="text-sm text-gray-600 mb-2">Step 1 of 3</p>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Create a password to start your membership
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-700 mb-1">
            Just a few more steps and you're done!
          </p>
          <p className="text-lg text-gray-700 mb-8">We hate paperwork, too.</p>

          {/* Form */}
          <form onSubmit={handleNext} className="space-y-6">
            {/* Email Input (disabled) */}
            <div className="relative">
              <input
                type="email"
                value={email}
                disabled
                className="w-full border-2 border-gray-300 rounded px-4 pt-6 pb-2 text-gray-900 bg-gray-50 cursor-not-allowed"
              />
              <label className="absolute left-4 top-2 text-xs text-gray-600">
                Email address
              </label>
            </div>

            {/* Password Input */}
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full border-2 border-gray-300 rounded px-4 pt-6 pb-2 text-gray-900 focus:border-netflix-red focus:outline-none transition"
                placeholder=" "
                required
              />
              <label className="absolute left-4 top-2 text-xs text-gray-600 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs transition-all">
                Password
              </label>
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={doNotEmail}
                onChange={(e) => setDoNotEmail(e.target.checked)}
                className="mt-1 w-5 h-5 border-2 border-gray-400 rounded cursor-pointer accent-netflix-red"
              />
              <span className="text-gray-700 group-hover:text-gray-900 transition">
                Please do not email me Netflix special offers.
              </span>
            </label>

            {/* Next Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full bg-netflix-red hover:bg-netflix-redHover text-white text-xl font-semibold py-4 rounded transition-colors shadow-lg disabled:opacity-50"
            >
              {loading ? "Đang tạo tài khoản..." : "Next"}
            </motion.button>

            {/* Skip Button */}
            <button
              type="button"
              onClick={handleSkip}
              className="w-full text-gray-600 hover:text-gray-900 text-sm font-medium underline transition"
            >
              Skip (Đăng nhập bằng email link)
            </button>
          </form>

          {/* Footer */}
          <p className="text-xs text-gray-500 mt-8">
            Questions?{" "}
            <a href="#" className="underline hover:text-gray-700">
              Contact us
            </a>
            .
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupStep3;
