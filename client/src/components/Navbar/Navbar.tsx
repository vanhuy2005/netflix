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
// @ts-expect-error - No TypeScript definition for firebase config
import { auth } from "../../config/firebase";
// @ts-expect-error - Component is in JSX
import SearchOverlay from "../Search/SearchOverlay";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(""); // Controlled input state
  const [currentProfileAvatar, setCurrentProfileAvatar] = useState(
    "/assets/profile_img.png"
  );
  const [showProfileMenu, setShowProfileMenu] = useState(false); // Dropdown menu state
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevPathRef = useRef<string>("/browse"); // Remember previous page
  const debounceTimerRef = useRef<number | null>(null); // Debounce timer
  const isTypingRef = useRef(false); // Track if user is typing to prevent URL overwrite
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const urlSearchQuery = searchParams.get("q") || "";

  // Compute whether search input should be visible
  const showSearch =
    isSearchOpen || (location.pathname === "/search" && !!urlSearchQuery);

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

  // Load current profile avatar from localStorage
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

    // Listen for profile changes (custom event from ProfileGate)
    window.addEventListener("profileChanged", loadProfileAvatar);
    return () =>
      window.removeEventListener("profileChanged", loadProfileAvatar);
  }, []);

  // Save previous path (context awareness)
  useEffect(() => {
    if (location.pathname !== "/search") {
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  // Sync keyword from URL when navigating TO search page (initial load or browser back/forward)
  useEffect(() => {
    // Don't sync if user is actively typing
    if (isTypingRef.current) return;

    if (location.pathname === "/search" && urlSearchQuery) {
      // Only sync if keyword is different (prevents loop)
      if (searchKeyword !== urlSearchQuery) {
        setSearchKeyword(urlSearchQuery);
      }
      setIsSearchOpen(true);
    } else if (location.pathname !== "/search" && searchKeyword) {
      // Clear keyword when leaving search page
      setSearchKeyword("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, urlSearchQuery]); // Intentionally exclude searchKeyword to prevent loop

  // Focus input when search box opens
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle search input change with debounce (NO immediate navigation)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Mark as typing to prevent URL from overwriting input
    isTypingRef.current = true;

    // Update local state immediately for smooth UX
    setSearchKeyword(value);
    setShowSearchOverlay(false); // Hide overlay when typing

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce navigation (300ms delay for better responsiveness)
    debounceTimerRef.current = window.setTimeout(() => {
      isTypingRef.current = false; // User stopped typing

      if (value.trim()) {
        // User typed something - navigate to search page
        navigate(`/search?q=${encodeURIComponent(value.trim())}`, {
          replace: true,
        });
      } else {
        // User cleared input - smart go back
        if (location.pathname === "/search") {
          const prevPath = prevPathRef.current || "/browse";
          navigate(prevPath);
          setIsSearchOpen(false);
          setShowSearchOverlay(false);
        }
      }
    }, 300);
  };

  // Handle search icon click
  const handleSearchClick = () => {
    if (location.pathname === "/search") {
      // Already on search page, just show input
      setIsSearchOpen(true);
    } else {
      // Show overlay with top searches
      setShowSearchOverlay(true);
      setIsSearchOpen(true);
    }
  };

  // Handle close search (X button click)
  const handleCloseSearch = () => {
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setSearchKeyword(""); // Clear keyword
    setIsSearchOpen(false);
    setShowSearchOverlay(false);

    if (location.pathname === "/search") {
      // Smart navigation - go back to previous page
      const prevPath = prevPathRef.current || "/browse";
      navigate(prevPath);
    }
  };

  // Handle close overlay
  const handleCloseOverlay = () => {
    setShowSearchOverlay(false);
    setIsSearchOpen(false);
    setSearchKeyword(""); // Clear keyword
  };

  // Handle input blur
  const handleSearchBlur = () => {
    // Don't close if on search page or overlay is showing
    if (
      !searchKeyword.trim() &&
      location.pathname !== "/search" &&
      !showSearchOverlay
    ) {
      setIsSearchOpen(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("current_profile"); // Clear profile
      console.log("Đăng xuất thành công");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Không thể đăng xuất. Vui lòng thử lại.");
    }
  };

  // Handle manage profiles navigation
  const handleManageProfiles = () => {
    setShowProfileMenu(false);
    navigate("/profiles");
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 w-full z-50 px-8 py-5 transition-all duration-500"
      style={{
        background: scrolled
          ? "linear-gradient(to bottom, rgba(20, 20, 20, 0.98) 0%, rgba(20, 20, 20, 0.95) 70%)" // Khi cuộn: Gradient đậm hơn
          : "linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%)", // Khi ở đỉnh: Gradient mờ
      }}
    >
      <div className="flex items-center justify-between max-w-[1920px] mx-auto">
        {/* Logo */}
        <div className="flex items-center space-x-8">
          <motion.img
            src="/assets/logo.png"
            alt="Netflix"
            onClick={() => navigate("/browse")}
            className="h-7 md:h-9 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          />

          {/* Navigation Links - Netflix Style */}
          <div className="hidden md:flex space-x-5">
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
                className="text-[16px] font-medium text-[#e5e5e5] hover:text-white transition-colors duration-300"
                whileHover={{ scale: 1.02 }}
              >
                {item.name}
              </motion.a>
            ))}
          </div>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center space-x-4">
          {/* Animated Search Box with Dropdown */}
          <div className="flex items-center relative">
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex items-center bg-black border border-white rounded-sm overflow-hidden mr-2"
                >
                  <IoSearchOutline className="text-white ml-3 text-xl flex-shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchKeyword}
                    onChange={handleSearchChange}
                    onBlur={handleSearchBlur}
                    placeholder="Tìm phim, diễn viên..."
                    className="bg-transparent text-white text-[16px] px-3 py-2 outline-none w-full placeholder-gray-400"
                  />
                  {searchKeyword && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseSearch(); // Use smart navigation
                      }}
                      className="text-white mr-3 flex-shrink-0 hover:text-gray-300 transition-colors"
                      title="Xóa và quay lại"
                    >
                      <IoCloseOutline className="text-2xl" />
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!showSearch && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={handleSearchClick}
                className="text-white"
              >
                <IoSearchOutline className="text-[26px]" />
              </motion.button>
            )}

            {/* Search Overlay Dropdown - Show when search is open but no keyword */}
            <AnimatePresence>
              {showSearchOverlay && !searchKeyword && (
                <SearchOverlay onClose={handleCloseOverlay} />
              )}
            </AnimatePresence>
          </div>{" "}
          <motion.img
            src="/assets/bell_icon.svg"
            alt="Notifications"
            className="h-6 w-6 cursor-pointer"
            whileHover={{ scale: 1.1 }}
          />
          {/* Profile Dropdown Menu */}
          <div
            className="relative group"
            onMouseEnter={() => setShowProfileMenu(true)}
            onMouseLeave={() => setShowProfileMenu(false)}
          >
            {/* Avatar + Chevron */}
            <div className="flex items-center gap-1 cursor-pointer">
              <motion.img
                src={currentProfileAvatar}
                alt="Profile"
                className="h-12 w-12 rounded-md object-cover ring-2 ring-transparent group-hover:ring-white transition-all"
                whileHover={{ scale: 1.05 }}
              />
              <motion.div
                animate={{ rotate: showProfileMenu ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <IoChevronDown className="text-white text-base" />
              </motion.div>
            </div>

            {/* Dropdown Menu - Cinematic Style */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute top-full right-0 mt-3 w-56 bg-black/95 border-t-2 border-white/20 shadow-2xl overflow-hidden"
                  style={{ backdropFilter: "blur(16px)" }}
                >
                  {/* Triangle pointer */}
                  <div className="absolute -top-1 right-6 w-0 h-0 border-l-6 border-r-6 border-b-6 border-transparent border-b-white/20"></div>

                  {/* Menu Items */}
                  <div className="py-1">
                    {/* Manage Profiles */}
                    <button
                      onClick={handleManageProfiles}
                      className="w-full px-5 py-3 text-left text-[#e5e5e5] text-[13px] hover:underline transition-all flex items-center gap-3 group/item"
                    >
                      <IoSettingsOutline className="text-lg" />
                      <span className="font-normal">Quản lý hồ sơ</span>
                    </button>

                    {/* Divider */}
                    <div className="border-t border-gray-700/50 my-1"></div>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full px-5 py-3 text-left text-[#e5e5e5] text-[13px] hover:underline transition-all flex items-center gap-3 group/item"
                    >
                      <IoLogOutOutline className="text-lg" />
                      <span className="font-normal">
                        Đăng xuất khỏi Netflix
                      </span>
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
