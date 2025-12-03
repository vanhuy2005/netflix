import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { IoSearchOutline, IoCloseOutline } from "react-icons/io5";
// @ts-expect-error - Component is in JSX
import SearchOverlay from "../Search/SearchOverlay";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(""); // Local state for input
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevPathRef = useRef<string>("/browse"); // Remember previous page
  const debounceTimerRef = useRef<number | null>(null); // Debounce timer
  const isTypingRef = useRef(false); // Track if user is actively typing
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Compute whether search input should be visible
  const urlSearchQuery = searchParams.get("q") || "";
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

  // Save previous path (context awareness)
  useEffect(() => {
    if (location.pathname !== "/search") {
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

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

    // Mark as typing to prevent URL sync from overriding
    isTypingRef.current = true;

    // Update local state immediately for smooth UX
    setSearchKeyword(value);
    setShowSearchOverlay(false); // Hide overlay when typing

    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce navigation (500ms delay)
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
    }, 500);
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

    setSearchKeyword(""); // Clear local state
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
    setSearchKeyword(""); // Clear local state
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

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 w-full z-50 px-8 py-4 transition-all duration-500 ${
        scrolled
          ? "bg-[#141414] backdrop-blur-sm"
          : "bg-gradient-to-b from-black/70 via-black/50 to-transparent"
      }`}
    >
      <div className="flex items-center justify-between max-w-[1920px] mx-auto">
        {/* Logo */}
        <div className="flex items-center space-x-8">
          <motion.img
            src="/assets/logo.png"
            alt="Netflix"
            onClick={() => navigate("/browse")}
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
                  <IoSearchOutline className="text-white ml-3 text-lg flex-shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchKeyword}
                    onChange={handleSearchChange}
                    onBlur={handleSearchBlur}
                    placeholder="Tìm phim, diễn viên..."
                    className="bg-transparent text-white text-sm px-3 py-2 outline-none w-full placeholder-gray-400"
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
                      <IoCloseOutline className="text-xl" />
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
                <IoSearchOutline className="text-2xl" />
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
