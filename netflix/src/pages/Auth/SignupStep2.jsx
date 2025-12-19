import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { sendEmailLink } from "../../config/emailAuth";
import { toast } from "react-toastify";

const SignupStep2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = location.state || {};
  const [sending, setSending] = useState(true);
  const [sent, setSent] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate("/");
      return;
    }

    // Auto send email link khi vào trang
    const sendLink = async () => {
      try {
        await sendEmailLink(email);
        setSent(true);
      } catch (error) {
        console.error("Error sending email:", error);
        toast.error("Không thể gửi email. Vui lòng thử lại");
      } finally {
        setSending(false);
      }
    };

    sendLink();
  }, [email, navigate]);

  const handleResend = async () => {
    setResending(true);
    try {
      await sendEmailLink(email);
      toast.success("📧 Đã gửi lại email!");
    } catch (error) {
      toast.error("Không thể gửi lại email");
    } finally {
      setResending(false);
    }
  };

  const handleCreatePassword = () => {
    navigate("/signup/step3", { state: { email } });
  };

  if (sending) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-netflix-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Đang gửi email...</p>
        </div>
      </div>
    );
  }

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
      </header>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Email Icon Animation */}
          <motion.div
            className="relative w-32 h-32 mx-auto mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
          >
            {/* Envelope */}
            <div className="relative">
              <motion.div
                className="w-32 h-24 bg-gradient-to-br from-purple-500 to-red-500 rounded-lg shadow-2xl"
                animate={{
                  rotateY: [0, 360],
                }}
                transition={{
                  duration: 2,
                  ease: "easeInOut",
                }}
              />
              {/* Notification Badge */}
              <motion.div
                className="absolute -top-2 -right-2 w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                <div className="w-6 h-6 bg-white rounded-full" />
              </motion.div>
            </div>
          </motion.div>

          {/* Step Indicator */}
          <p className="text-sm text-gray-600 mb-2">Step 1 of 3</p>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Check your inbox
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-700 mb-8">
            We sent a sign-up link to{" "}
            <span className="font-semibold text-gray-900">{email}</span>. Tap
            the link in the email to finish setting up your account.
          </p>

          {/* Resend Button */}
          <motion.button
            onClick={handleResend}
            disabled={resending}
            whileHover={{ scale: resending ? 1 : 1.02 }}
            whileTap={{ scale: resending ? 1 : 0.98 }}
            className="w-full bg-netflix-red hover:bg-netflix-redHover text-white text-xl font-semibold py-4 rounded transition-colors shadow-lg mb-4 disabled:opacity-50"
          >
            {resending ? "Đang gửi..." : "Resend link"}
          </motion.button>

          {/* Alternative Option */}
          <motion.button
            onClick={handleCreatePassword}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 text-xl font-semibold py-4 rounded transition-colors"
          >
            Create password instead
          </motion.button>

          {/* Helper Text */}
          <p className="text-sm text-gray-500 text-center mt-6">
            Email có thể mất vài phút để đến. Kiểm tra cả thư mục Spam/Junk.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupStep2;
