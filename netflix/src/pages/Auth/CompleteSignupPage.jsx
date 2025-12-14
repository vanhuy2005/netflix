import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  completeEmailLinkSignIn,
  checkEmailLink,
} from "../../config/emailAuth";
import NetflixSpinner from "../../components/common/NetflixSpinner";
import { toast } from "react-toastify";

const CompleteSignupPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsEmail, setNeedsEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleEmailLinkSignIn = async () => {
      try {
        if (!checkEmailLink()) {
          setError("Link không hợp lệ");
          setLoading(false);
          return;
        }

        await completeEmailLinkSignIn();

        toast.success("🎉 Đăng nhập thành công!");

        // Redirect to browse page sau khi thành công
        setTimeout(() => {
          navigate("/browse");
        }, 1500);
      } catch (err) {
        console.error("Error completing sign-in:", err);

        if (err.message === "EMAIL_REQUIRED") {
          // Hiển thị form nhập email
          setNeedsEmail(true);
          setLoading(false);
        } else {
          setError(err.message || "Không thể hoàn tất đăng nhập");
          setLoading(false);
        }
      }
    };

    handleEmailLinkSignIn();
  }, [navigate]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Vui lòng nhập email hợp lệ");
      return;
    }

    setSubmitting(true);
    try {
      await completeEmailLinkSignIn(email);

      toast.success("🎉 Đăng nhập thành công!");

      setTimeout(() => {
        navigate("/browse");
      }, 1500);
    } catch (err) {
      console.error("Error completing sign-in:", err);
      toast.error("Email không khớp hoặc link không hợp lệ");
      setSubmitting(false);
    }
  };

  // Form nhập email nếu cần
  if (needsEmail) {
    return (
      <div className="min-h-screen bg-netflix-deepBlack flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/75 backdrop-blur-sm rounded-lg p-8 md:p-12 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <img
              src="/assets/logo.png"
              alt="Netflix"
              className="h-12 mx-auto mb-6"
            />
            <h2 className="text-2xl font-bold text-white mb-2">
              Xác nhận Email
            </h2>
            <p className="text-netflix-lightGray text-sm">
              Vui lòng nhập email bạn đã sử dụng để đăng ký
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer w-full bg-[#333] text-white px-5 pt-6 pb-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white transition-all"
                placeholder=" "
                required
                autoFocus
              />
              <label className="absolute left-5 top-4 text-gray-400 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs">
                Email của bạn
              </label>
            </div>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: submitting ? 1 : 1.02 }}
              whileTap={{ scale: submitting ? 1 : 0.98 }}
              className="w-full bg-netflix-red hover:bg-netflix-redHover text-white font-bold py-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Đang xác thực..." : "Xác nhận"}
            </motion.button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full text-netflix-lightGray hover:text-white text-sm transition-colors"
            >
              Về trang chủ
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-deepBlack flex flex-col items-center justify-center">
        <NetflixSpinner />
        <p className="text-white mt-6 text-lg">Đang xác thực...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-netflix-deepBlack flex flex-col items-center justify-center p-4">
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">❌ Lỗi</h2>
          <p className="text-white mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-netflix-red hover:bg-netflix-redHover text-white px-6 py-3 rounded font-semibold"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-deepBlack flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-3xl font-bold text-white mb-2">Thành công!</h2>
        <p className="text-netflix-lightGray">Đang chuyển hướng...</p>
      </div>
    </div>
  );
};

export default CompleteSignupPage;
