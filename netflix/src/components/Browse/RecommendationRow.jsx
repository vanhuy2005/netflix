import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { IoSparkles } from "react-icons/io5";
import { useSmartRecommendations } from "../../hooks/useSmartRecommendations";
import { RecommendationRowSkeleton } from "../common/Skeleton";
import MovieCard from "./MovieCard";

/**
 * Recommendation Row Component
 * Displays personalized movie recommendations based on watch history
 * PHASE 1.2: Implements lazy loading with IntersectionObserver
 */
const RecommendationRow = ({ user, profileId }) => {
  // PHASE 1.2: Lazy loading state
  const [shouldFetch, setShouldFetch] = useState(false);
  const containerRef = useRef(null);

  // PHASE 1.2: Pass shouldFetch to hook to control execution
  const { movies, reason, loading } = useSmartRecommendations(user, profileId, shouldFetch);
  
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const rowRef = useRef(null);

  // ========================================
  // PHASE 1.2: IntersectionObserver for Lazy Loading
  // ========================================
  useEffect(() => {
    // If already fetched, don't observe anymore
    if (shouldFetch) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When component enters viewport (or gets close)
        if (entry.isIntersecting) {
          console.log("👀 [UI] User scrolled near Recommendations → Activating Engine!");
          setShouldFetch(true);
          observer.disconnect(); // Stop observing after trigger
        }
      },
      {
        rootMargin: "200px", // Trigger 200px before visible (smoother UX)
        threshold: 0.1,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [shouldFetch]);

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
  // PHASE 1.2: Render States
  // ========================================
  // 1. Not fetched yet → Show placeholder (invisible, but measurable for IntersectionObserver)
  if (!shouldFetch) {
    return <div ref={containerRef} className="w-full h-40" />; 
  }

  // 2. Fetching → Show skeleton (professional loading state)
  if (loading) return <RecommendationRowSkeleton />;
  
  // 3. No movies → Hide component (Netflix-style - don't show empty states)
  if (!movies || movies.length === 0) return null;

  return (
    <div className="relative w-full mb-4 md:mb-8 z-30 hover:z-50 group/row">
      {/* Title - Dynamic based on backend reason */}
      <div className="pl-[4%] md:pl-[60px] mb-2 flex items-center gap-2 relative z-20">
        <motion.h2
          key={reason} // Re-animate when reason changes
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-sm md:text-xl lg:text-2xl font-bold mb-2 md:mb-3 text-[#e5e5e5] hover:text-white transition-colors cursor-pointer"
        >
          {reason || "Gợi ý cho bạn"}
        </motion.h2>
      </div>

      {/* Movie Cards Container */}
      <div className="relative group">
        {/* Left Arrow */}
        {/* [DESIGN UPDATE]: Dùng Gradient thay vì Solid Black */}
        <button
          onClick={() => handleScroll("left")}
          className={`absolute left-0 top-24 bottom-24 z-40 w-12 md:w-16 
            bg-gradient-to-r from-black/70 via-black/30 to-transparent 
            hover:from-black/90 hover:via-black/50 hover:to-transparent
            hidden md:flex items-center justify-center transition-all duration-300 
            ${
              showLeftArrow
                ? "opacity-0 group-hover:opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          aria-label="Scroll left"
        >
          <FaChevronLeft className="text-white text-3xl md:text-4xl drop-shadow-lg transform transition hover:scale-125" />
        </button>

        {/* Scrollable Row */}
        <div
          ref={rowRef}
          className="flex overflow-x-scroll scrollbar-hide pl-[4%] md:pl-[60px] gap-2 scroll-smooth max-w-full py-24 -my-24"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {movies.map((movie, index) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isLarge={false}
              isFirst={index === 0}
              isLast={index === movies.length - 1}
            />
          ))}
        </div>

        {/* Right Arrow */}
        {/* [DESIGN UPDATE]: Dùng Gradient thay vì Solid Black */}
        <button
          onClick={() => handleScroll("right")}
          className={`absolute right-0 top-24 bottom-24 z-40 w-12 md:w-16 
            bg-gradient-to-l from-black/70 via-black/30 to-transparent 
            hover:from-black/90 hover:via-black/50 hover:to-transparent
            hidden md:flex items-center justify-center transition-all duration-300 
            ${
              showRightArrow
                ? "opacity-0 group-hover:opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          aria-label="Scroll right"
        >
          <FaChevronRight className="text-white text-3xl md:text-4xl drop-shadow-lg transform transition hover:scale-125" />
        </button>
      </div>

      {import.meta.env.DEV && movies.length > 0 && (
        <div className="pl-[4%] md:pl-[60px] mt-1 text-xs text-gray-600 relative z-10">
          {movies.length} recs • Score: {Math.round(movies[0].score || 0)}
        </div>
      )}
    </div>
  );
};

export default RecommendationRow;
