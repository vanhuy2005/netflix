import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY >= 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 w-full z-50 px-8 py-4 transition-colors duration-500 ${
        scrolled
          ? "bg-[#141414]"
          : "bg-transparent bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="flex items-center justify-between max-w-[1920px] mx-auto">
        {/* Logo */}
        <div className="flex items-center space-x-8">
          <motion.img
            src="/assets/logo.png"
            alt="Netflix"
            className="h-8 md:h-10 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          />

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-6">
            {[
              { name: "Trang chủ", path: "/browse" },
              { name: "Phim truyền hình", path: "#" },
              { name: "Phim", path: "#" },
              { name: "Mới & Phổ biến", path: "#" },
              { name: "Danh sách của tôi", path: "/my-list" },
            ].map((item) => (
              <motion.a
                key={item.name}
                href={item.path}
                onClick={(e) => {
                  if (item.path !== "#") {
                    e.preventDefault();
                    navigate(item.path);
                  }
                }}
                className="text-sm font-medium text-netflix-lightGray hover:text-netflix-white transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                {item.name}
              </motion.a>
            ))}
          </div>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center space-x-4">
          <motion.img
            src="/assets/search_icon.svg"
            alt="Search"
            className="h-6 w-6 cursor-pointer"
            whileHover={{ scale: 1.1 }}
          />
          <motion.img
            src="/assets/bell_icon.svg"
            alt="Notifications"
            className="h-6 w-6 cursor-pointer"
            whileHover={{ scale: 1.1 }}
          />
          <motion.img
            src="/assets/profile_img.png"
            alt="Profile"
            className="h-8 w-8 rounded cursor-pointer"
            whileHover={{ scale: 1.1 }}
            onClick={() => navigate("/profile")}
          />
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
