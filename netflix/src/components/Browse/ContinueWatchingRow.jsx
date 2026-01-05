import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { IoPlayCircle } from "react-icons/io5";
import { useContinueWatching } from "../../hooks/useContinueWatching";
import { RecommendationRowSkeleton } from "../common/Skeleton";
import MovieCard from "./MovieCard";

/**
 * Continue Watching Row Component (PHASE 2)
 * Displays movies user has partially watched (5% < progress < 95%)
 * Features:
 * - Progress bar on each card
 * - Resume playback from last position
 * - Profile-specific watch history
 * - Gradient navigation arrows
 * - Zoom-friendly layout
 * * @param {Object} user - Firebase Auth user
 * @param {string} profileId - Current profile ID
 * @param {string} profileName - Profile display name (for title)
 */
const ContinueWatchingRow = ({ user, profileId, profileName = "You" }) => {
  const { movies, loading } = useContinueWatching(user, profileId);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const rowRef = useRef(null);

  // ========================================
  // Scroll Navigation
  // ========================================
  const handleScroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo =
        direction === "left"
          ? scrollLeft - clientWidth
          : scrollLeft + clientWidth;

      rowRef.current.scrollTo({
        left: scrollTo,
        behavior: "smooth",
      });
    }
  };

  const checkArrows = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const currentRow = rowRef.current;
    if (currentRow) {
      currentRow.addEventListener("scroll", checkArrows);
      checkArrows(); // Initial check
    }
    return () => {
      if (currentRow) {
        currentRow.removeEventListener("scroll", checkArrows);
      }
    };
  }, [movies]);

  // ========================================
  // Loading State (Skeleton)
  // ========================================
  if (loading) {
    return <RecommendationRowSkeleton />;
  }

  // ========================================
  // Empty State (No partially watched movies)
  // ========================================
  if (movies.length === 0) {
    return null; // Gracefully hide if no data
  }

  // ========================================
  // Render Continue Watching Row
  // ========================================
  return (
    // z-40 container to prevent Billboard from overlapping
    <div className="relative group mb-4 md:mb-8 w-full max-w-full z-40 pointer-events-auto">
      {/* Title with Play Icon - Higher z-index to prevent Billboard overlap */}
      <div className="pl-[4%] md:pl-[60px] mb-2 flex items-center gap-2 relative z-50 pointer-events-auto">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm md:text-xl lg:text-2xl font-bold mb-2 md:mb-3 text-[#e5e5e5] hover:text-white transition-colors cursor-pointer"
        >
          Tiếp Tục Xem Cho {profileName}
        </motion.h2>
      </div>

      {/* Movie Cards Container */}
      <div className="relative group">
        {/* Left Arrow (Gradient Style) */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-24 bottom-24 z-40 w-12 md:w-16 
              bg-gradient-to-r from-black/70 via-black/30 to-transparent 
              hover:from-black/90 hover:via-black/50 hover:to-transparent
              hidden md:flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 rounded-r-md"
            aria-label="Scroll left"
          >
            <FaChevronLeft className="text-white text-3xl md:text-4xl drop-shadow-lg transform transition hover:scale-125" />
          </button>
        )}

        {/* Scrollable Row */}
        <div
          ref={rowRef}
          // py-24 -my-24: Padding hack để chứa thẻ expanded mà không bị cắt
          className="flex overflow-x-scroll scrollbar-hide pl-[4%] md:pl-[60px] gap-2 scroll-smooth max-w-full py-24 -my-24"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch", // Smooth scroll on iOS
          }}
        >
          {movies.map((movie, index) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isLarge={false}
              isFirst={index === 0}
              isLast={index === movies.length - 1}
              hideExpandedFooter={true}
            />
          ))}
        </div>

        {/* Right Arrow (Gradient Style) */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-24 bottom-24 z-40 w-12 md:w-16 
              bg-gradient-to-l from-black/70 via-black/30 to-transparent 
              hover:from-black/90 hover:via-black/50 hover:to-transparent
              hidden md:flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 rounded-l-md"
            aria-label="Scroll right"
          >
            <FaChevronRight className="text-white text-3xl md:text-4xl drop-shadow-lg transform transition hover:scale-125" />
          </button>
        )}
      </div>

      {/* Debug Info (Development Only - remove in production) */}
      {import.meta.env.DEV && movies.length > 0 && (
        <div className="pl-[4%] md:pl-[60px] mt-1 text-xs text-gray-600 relative z-10">
          {movies.length} movies • Progress:{" "}
          {Math.round(movies[0].percentage || 0)}% -{" "}
          {Math.round(movies[movies.length - 1].percentage || 0)}%
        </div>
      )}
    </div>
  );
};

export default ContinueWatchingRow;
