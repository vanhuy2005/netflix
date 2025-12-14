import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaChevronRight } from "react-icons/fa";
import { toast } from "react-toastify";

const HeroSection = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleGetStarted = (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Vui lòng nhập email");
      return;
    }

    // Navigate to signup step 1 với email
    navigate("/signup/step1", { state: { email } });
  };
  return (
    <div className="relative h-screen w-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/assets/background_banner.jpg"
          alt="Hero Background"
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-deepBlack via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
            Phim, series không giới hạn và nhiều nội dung khác
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl lg:text-3xl text-white font-medium mb-4">
            Giá từ 74.000 ₫. Hủy bất kỳ lúc nào.
          </p>

          <p className="text-lg md:text-xl text-white mb-8">
            Bạn đã sẵn sàng xem chưa? Nhập email để tạo hoặc kích hoạt lại tư
            cách thành viên của bạn.
          </p>

          {/* Email Form */}
          <form
            onSubmit={handleGetStarted}
            className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-3xl mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Địa chỉ email"
              className="w-full md:flex-1 bg-black/50 backdrop-blur-sm border border-gray-500 text-white px-6 py-4 md:py-5 rounded-md text-lg focus:outline-none focus:border-white transition-colors"
              required
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full md:w-auto bg-netflix-red hover:bg-netflix-redHover text-white font-bold px-8 py-4 md:py-5 rounded-md text-xl md:text-2xl flex items-center justify-center gap-2 transition-colors"
            >
              Bắt đầu
              <FaChevronRight className="text-lg" />
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;
