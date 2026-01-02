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
    // [FIX 1] hover:z-50: Đảm bảo hàng đang hover đè lên hàng bên dưới/trên
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
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-0 bottom-0 z-40 w-12 bg-black/50 hover:bg-black/70 hidden md:flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 rounded-r-md"
          >
            <FaChevronLeft className="text-2xl text-white" />
          </button>
        )}

        {/* Scrollable Area */}
        <div
          ref={rowRef}
          // [FIX 2] Tăng padding dọc lên py-24 (96px) để đủ chỗ cho thẻ phóng to 1.8 lần
          // Sử dụng negative margin -my-24 để không làm vỡ layout chung của trang
          className="flex flex-nowrap items-center gap-2 md:gap-3 overflow-x-scroll scrollbar-hide scroll-smooth w-full px-[4%] md:px-[60px] py-24 -my-24"
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
              fluid={false} 
            />
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-0 bottom-0 z-40 w-12 bg-black/50 hover:bg-black/70 hidden md:flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 rounded-l-md"
          >
            <FaChevronRight className="text-2xl text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Row;