import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import MovieCard from "./MovieCard";

const Row = ({ title, fetchUrl, isLarge = false }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const rowRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(fetchUrl, {
          timeout: 8000, // 8 second timeout
        });

        // FAIL-SAFE: Filter valid movies only
        const validMovies = (response.data.results || []).filter(
          (movie) =>
            movie.id &&
            (movie.poster_path || movie.backdrop_path) &&
            (movie.title || movie.name)
        );

        setMovies(validMovies);

        if (validMovies.length === 0) {
          console.log(`No valid movies in ${title}`);
        }
      } catch (error) {
        console.error(`Error fetching ${title}:`, error.message);
        // FAIL-SAFE: Set empty array on error (no crash, just empty row)
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchUrl, title]);

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

  if (loading) {
    return (
      <div className="w-full mb-4 md:mb-8">
        <h2 className="text-sm md:text-lg lg:text-xl font-semibold mb-2 pl-[4%] md:pl-[60px]">
          {title}
        </h2>
        <div className="flex gap-2 overflow-hidden pl-[4%] md:pl-[60px]">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className={`${
                isLarge
                  ? "min-w-[120px] md:min-w-[150px] aspect-[2/3]"
                  : "min-w-[180px] md:min-w-[220px] aspect-video"
              } animate-shimmer rounded-md`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative z-10 group/row mb-2 md:mb-4 hover:z-50">
      {/* Row Title - Netflix style */}
      <h2 className="text-sm md:text-base lg:text-lg font-bold mb-1 md:mb-2 text-white pl-[4%] md:pl-[60px] hover:text-gray-300 transition-colors cursor-pointer">
        {title}
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="hidden group-hover/row:inline-flex items-center gap-1 text-[#ffffff] text-xs ml-2"
        >
          <motion.span
            initial={{ x: -5 }}
            animate={{ x: 0 }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut",
              repeatType: "reverse",
            }}
          >
            →
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            Xem tất cả
          </motion.span>
        </motion.span>
      </h2>

      {/* Movies Container with Navigation */}
      <div className="relative">
        {/* Left Arrow - Full Height, Subtle */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-0 bottom-0 z-40 w-10 md:w-14 bg-gradient-to-r from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300"
          >
            <motion.div
              whileHover={{ scale: 1.2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <FaChevronLeft className="text-xl md:text-2xl text-white drop-shadow-lg" />
            </motion.div>
          </button>
        )}

        {/* Movies Scroll Container */}
        {/* py-20 -my-20: Expanded safe zone for larger card hover expansion (1.8x scale) */}
        <div
          ref={rowRef}
          className="flex gap-1.5 md:gap-2 overflow-x-scroll scrollbar-hide scroll-smooth w-full pl-[4%] md:pl-[60px] pr-[4%] md:pr-[60px] py-20 -my-20"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {movies.map((movie, index) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isLarge={isLarge}
              isFirst={index === 0}
              isLast={index === movies.length - 1}
            />
          ))}
        </div>

        {/* Right Arrow - Full Height, Subtle */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-0 bottom-0 z-40 w-10 md:w-14 bg-gradient-to-l from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300"
          >
            <motion.div
              whileHover={{ scale: 1.2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <FaChevronRight className="text-xl md:text-2xl text-white drop-shadow-lg" />
            </motion.div>
          </button>
        )}
      </div>
    </div>
  );
};

export default Row;
