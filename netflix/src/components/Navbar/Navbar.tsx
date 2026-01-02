import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  IoSearchOutline,
  IoCloseOutline,
  IoSettingsOutline,
  IoLogOutOutline,
  IoChevronDown,
} from "react-icons/io5";
import { signOut } from "firebase/auth";

// --- SỬA LỖI TS: Thêm @ts-ignore để bỏ qua kiểm tra kiểu cho file JS ---

// @ts-expect-error: allow importing JS module without type declarations
import { auth } from "../../config/firebase";

// @ts-expect-error: allow importing JSX component without type declarations
import SearchOverlay from "../Search/SearchOverlay";

const Navbar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  // Initialize from URL so we don't synchronously set state in an effect
  const [searchKeyword, setSearchKeyword] = useState(
    () => searchParams.get("q") || ""
  );
  const [currentProfileAvatar, setCurrentProfileAvatar] = useState(
    "/assets/profile_img.png"
  );
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // [NEW] Mobile check state (Thêm vào để fix lỗi vỡ layout mobile)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevPathRef = useRef<string>("/browse");
  const debounceTimerRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  const urlSearchQuery = searchParams.get("q") || "";
  const showSearch =
    isSearchOpen || (location.pathname === "/search" && !!urlSearchQuery);

  // [NEW] Resize listener (Thêm vào để fix lỗi vỡ layout mobile)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  useEffect(() => {
    const loadProfileAvatar = () => {
      try {
        const profileData = localStorage.getItem("current_profile");
        if (profileData) {
          const profile = JSON.parse(profileData);
          if (profile.avatar) {
            setCurrentProfileAvatar(profile.avatar);
          }
        }
      } catch (error) {
        console.error("Error loading profile avatar:", error);
      }
    };

    loadProfileAvatar();
    window.addEventListener("profileChanged", loadProfileAvatar);
    return () =>
      window.removeEventListener("profileChanged", loadProfileAvatar);
  }, []);

  useEffect(() => {
    if (location.pathname !== "/search") {
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  useEffect(() => {
    // Sync when URL changes from outside (e.g., browser back/forward). Skip if user is actively typing.
    if (isTypingRef.current) return;

    if (location.pathname === "/search") {
      // Only update local state if the URL query differs from current input
      if (searchKeyword !== urlSearchQuery) {
        // Schedule update asynchronously so we don't call setState synchronously in an effect
        Promise.resolve().then(() => setSearchKeyword(urlSearchQuery));
      }
    } else {
      // Left the search page -> clear input if needed
      if (searchKeyword) {
        // make async to avoid synchronous setState in effect
        Promise.resolve().then(() => setSearchKeyword(""));
      }
    }
  }, [location.pathname, urlSearchQuery, searchKeyword]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    isTypingRef.current = true;
    setSearchKeyword(value);
    setShowSearchOverlay(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      isTypingRef.current = false;
      if (value.trim()) {
        navigate(`/search?q=${encodeURIComponent(value.trim())}`, {
          replace: true,
        });
      } else {
        if (location.pathname === "/search") {
          const prevPath = prevPathRef.current || "/browse";
          navigate(prevPath);
          setIsSearchOpen(false);
          setShowSearchOverlay(false);
        }
      }
    }, 300);
  };

  const handleSearchClick = () => {
    if (location.pathname === "/search") {
      setIsSearchOpen(true);
    } else {
      setShowSearchOverlay(true);
      setIsSearchOpen(true);
    }
  };

  const handleCloseSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setSearchKeyword("");
    setIsSearchOpen(false);
    setShowSearchOverlay(false);

    if (location.pathname === "/search") {
      const prevPath = prevPathRef.current || "/browse";
      navigate(prevPath);
    }
  };

  const handleCloseOverlay = () => {
    setShowSearchOverlay(false);
    setIsSearchOpen(false);
    setSearchKeyword("");
  };

  const handleSearchBlur = () => {
    if (
      !searchKeyword.trim() &&
      location.pathname !== "/search" &&
      !showSearchOverlay
    ) {
      setIsSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("current_profile");
      console.log("Đăng xuất thành công");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Không thể đăng xuất. Vui lòng thử lại.");
    }
  };

  const handleManageProfiles = () => {
    setShowProfileMenu(false);
    navigate("/profiles");
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 w-full z-50 px-4 md:px-8 py-3 transition-all duration-500"
      style={{
        background: scrolled
          ? "linear-gradient(to bottom, rgba(20, 20, 20, 0.98) 0%, rgba(20, 20, 20, 0.95) 70%)"
          : "linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%)",
      }}
    >
      <div className="flex items-center justify-between max-w-[1920px] mx-auto">
        {/* Logo */}
        <div className="flex items-center space-x-6">
          <motion.img
            src="/assets/logo.png"
            alt="Netflix"
            onClick={() => navigate("/browse")}
            className="h-5 md:h-7 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          />

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4">
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
                className="text-[13px] font-medium text-[#e5e5e5] hover:text-white transition-colors duration-300"
                whileHover={{ scale: 1.02 }}
              >
                {item.name}
              </motion.a>
            ))}
          </div>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Animated Search Box */}
          <div className="flex items-center relative">
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  // [UPDATE FIX LAYOUT] Mobile: Width 160px, Desktop: 280px
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: isMobile ? 160 : 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex items-center bg-black border border-white rounded-sm overflow-hidden mr-2"
                >
                  <IoSearchOutline className="text-white ml-2 md:ml-3 text-lg md:text-xl flex-shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchKeyword}
                    onChange={handleSearchChange}
                    onBlur={handleSearchBlur}
                    // [UPDATE] Placeholder ngắn hơn trên mobile
                    placeholder={
                      isMobile ? "Tìm kiếm..." : "Tìm phim, diễn viên..."
                    }
                    className="bg-transparent text-white text-sm md:text-[16px] px-2 py-1 md:px-3 md:py-2 outline-none w-full placeholder-gray-400"
                  />
                  {searchKeyword && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseSearch();
                      }}
                      className="text-white mr-2 md:mr-3 flex-shrink-0 hover:text-gray-300"
                      title="Xóa và quay lại"
                    >
                      <IoCloseOutline className="text-xl md:text-2xl" />
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!showSearch && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={handleSearchClick}
                className="text-white p-1"
              >
                <IoSearchOutline className="text-xl md:text-[26px]" />
              </motion.button>
            )}

            {/* Search Overlay Dropdown */}
            <AnimatePresence>
              {showSearchOverlay && !searchKeyword && (
                <SearchOverlay onClose={handleCloseOverlay} />
              )}
            </AnimatePresence>
          </div>

          <motion.img
            src="/assets/bell_icon.svg"
            alt="Notifications"
            className="h-5 w-5 md:h-6 md:w-6 cursor-pointer"
            whileHover={{ scale: 1.1 }}
          />

          {/* Profile Dropdown */}
          <div
            className="relative group"
            onMouseEnter={() => !isMobile && setShowProfileMenu(true)}
            onMouseLeave={() => !isMobile && setShowProfileMenu(false)}
            onClick={() => isMobile && setShowProfileMenu(!showProfileMenu)}
          >
            <div className="flex items-center gap-1 cursor-pointer">
              <motion.img
                src={currentProfileAvatar}
                alt="Profile"
                className="h-8 w-8 md:h-12 md:w-12 rounded-md object-cover ring-2 ring-transparent group-hover:ring-white transition-all"
                whileHover={{ scale: 1.05 }}
              />
              <motion.div
                animate={{ rotate: showProfileMenu ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="hidden md:block" // Ẩn mũi tên trên mobile
              >
                <IoChevronDown className="text-white text-base" />
              </motion.div>
            </div>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute top-full right-0 mt-3 w-48 md:w-56 bg-black/95 border-t-2 border-white/20 shadow-2xl overflow-hidden z-[60]"
                  style={{ backdropFilter: "blur(16px)" }}
                >
                  <div className="absolute -top-1 right-2 md:right-6 w-0 h-0 border-l-6 border-r-6 border-b-6 border-transparent border-b-white/20"></div>

                  <div className="py-1">
                    <button
                      onClick={handleManageProfiles}
                      className="w-full px-4 py-3 text-left text-[#e5e5e5] text-xs md:text-[13px] hover:underline transition-all flex items-center gap-3 group/item"
                    >
                      <IoSettingsOutline className="text-base md:text-lg" />
                      <span className="font-normal">Quản lý hồ sơ</span>
                    </button>

                    <div className="border-t border-gray-700/50 my-1"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-[#e5e5e5] text-xs md:text-[13px] hover:underline transition-all flex items-center gap-3 group/item"
                    >
                      <IoLogOutOutline className="text-base md:text-lg" />
                      <span className="font-normal">Đăng xuất</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
