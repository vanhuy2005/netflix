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

  // Preload animation state for staggered entry
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50); // small delay then animate in
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(fetchUrl, {
          timeout: 8000,
        });

        const validMovies = (response.data.results || []).filter(
          (movie) =>
            movie.id &&
            (movie.poster_path || movie.backdrop_path) &&
            (movie.title || movie.name)
        );

        setMovies(validMovies);
      } catch (error) {
        console.error(`Error fetching ${title}:`, error.message);
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
      checkArrows();
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
        <h2 className="text-sm md:text-lg lg:text-xl font-semibold mb-2 pl-[4%] md:pl-[60px] text-white">
          {title}
        </h2>
        <div className="flex gap-2 overflow-hidden pl-[4%] md:pl-[60px]">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`flex-shrink-0 bg-gray-800 ${
                isLarge
                  ? "w-[110px] md:w-[150px] aspect-[2/3]"
                  : "w-[160px] md:w-[220px] aspect-video"
              } animate-pulse rounded-md`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (movies.length === 0) return null;

  return (
    <div className="w-full relative z-10 group/row hover:z-50 mb-4 md:mb-8">
      {/* Row Title */}
      <h2 className="text-sm md:text-xl lg:text-2xl font-bold mb-2 md:mb-3 text-[#e5e5e5] pl-[4%] md:pl-[60px] hover:text-white transition-colors cursor-pointer flex items-center gap-2">
        {title}
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="hidden md:group-hover/row:inline-flex items-center text-xs md:text-sm font-normal text-[#54b9c5]"
        >
          Xem tất cả <span className="ml-1">›</span>
        </motion.span>
      </h2>

      {/* Movies Container */}
      <div className="relative group">
        {/* Left Arrow - Updated Design */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-24 bottom-24 z-40 w-12 md:w-16 
              bg-gradient-to-r from-black/70 via-black/30 to-transparent 
              hover:from-black/90 hover:via-black/50 hover:to-transparent
              hidden md:flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 rounded-r-md"
          >
            <FaChevronLeft className="text-white text-3xl md:text-4xl drop-shadow-lg transform transition hover:scale-125" />
          </button>
        )}

        {/* Scrollable Area */}
        <div
          ref={rowRef}
          className="flex flex-nowrap items-center gap-2 md:gap-3 overflow-x-scroll scrollbar-hide scroll-smooth w-full px-[4%] md:px-[60px] py-24 -my-24"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {movies.map((movie, index) => (
            <div
              key={movie.id}
              className={`flex-shrink-0 transition-opacity duration-300 ease-out ${
                mounted ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <MovieCard
                movie={movie}
                isLarge={isLarge}
                isFirst={index === 0}
                isLast={index === movies.length - 1}
                fluid={false}
              />
            </div>
          ))}
        </div>

        {/* Right Arrow - Updated Design */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-24 bottom-24 z-40 w-12 md:w-16 
              bg-gradient-to-l from-black/70 via-black/30 to-transparent 
              hover:from-black/90 hover:via-black/50 hover:to-transparent
              hidden md:flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 rounded-l-md"
          >
            <FaChevronRight className="text-white text-3xl md:text-4xl drop-shadow-lg transform transition hover:scale-125" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Row;
