import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const LandingHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="absolute top-0 left-0 w-full z-30 px-8 md:px-16 py-6">
      <div className="flex items-center justify-between max-w-[1920px] mx-auto">
        {/* Logo */}
        <motion.img
          src="/assets/logo.png"
          alt="Netflix"
          className="h-8 md:h-12 cursor-pointer"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => navigate("/")}
        />

        {/* Right Side */}
        <div className="flex items-center space-x-4">
         
          {/* Language Selector */}
          <select className="bg-black/50 text-white border border-gray-500 px-4 py-2 rounded-md cursor-pointer hover:border-gray-400 transition-colors">
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>

          {/* Sign In Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/login")}
            className="bg-netflix-red hover:bg-netflix-redHover text-white font-semibold px-6 py-2 rounded-md transition-colors"
          >
            Đăng nhập
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
