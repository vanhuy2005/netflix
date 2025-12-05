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
      <div className="w-full mb-8 md:mb-12">
        <h2 className="text-xl md:text-2xl font-bold mb-4">{title}</h2>
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`${
                isLarge
                  ? "min-w-[150px] md:min-w-[200px] aspect-[2/3]"
                  : "min-w-[250px] md:min-w-[300px] aspect-video"
              } bg-netflix-darkGray animate-pulse rounded-md`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative z-10 group/row">
      {/* Row Title - Aligned with Billboard content */}
      <h2 className="text-lg md:text-xl font-medium mb-2 text-white pl-[4%] md:pl-[60px]">
        {title}
      </h2>

      {/* Movies Container with Navigation */}
      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-0 bottom-0 z-20 w-12 md:w-16 bg-black/80 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-black/90"
          >
            <FaChevronLeft className="text-3xl text-white drop-shadow-lg" />
          </motion.button>
        )}

        {/* Movies Scroll Container - Full Width with Strategic Padding */}
        <div
          ref={rowRef}
          className="flex gap-2 md:gap-4 overflow-x-scroll scrollbar-hide scroll-smooth w-full pl-[4%] md:pl-[60px] pr-[4%] md:pr-[60px] py-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} isLarge={isLarge} />
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-0 bottom-0 z-20 w-12 md:w-16 bg-black/80 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-black/90"
          >
            <FaChevronRight className="text-3xl text-white drop-shadow-lg" />
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default Row;
