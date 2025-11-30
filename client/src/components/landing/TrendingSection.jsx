import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTrending, getImageUrl } from "../../utils/tmdbApi";
import NetflixSpinner from "../common/NetflixSpinner";
import { FaPlay, FaInfoCircle, FaChevronRight } from "react-icons/fa";

const TrendingSection = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const MOVIES_PER_PAGE = 5;

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const data = await getTrending("all", "week");
        setMovies(data.results.slice(0, 10)); // Top 10 trending
      } catch (err) {
        console.error("Error fetching trending movies:", err);
        setError("Không thể tải phim thịnh hành");
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  const totalPages = Math.ceil(movies.length / MOVIES_PER_PAGE);
  const currentMovies = movies.slice(
    currentPage * MOVIES_PER_PAGE,
    (currentPage + 1) * MOVIES_PER_PAGE
  );

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (loading) {
    return (
      <div className="py-20 bg-netflix-deepBlack">
        <div className="flex justify-center items-center">
          <NetflixSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 bg-netflix-deepBlack">
        <div className="text-center text-netflix-lightGray">{error}</div>
      </div>
    );
  }

  return (
    <section className="py-12 md:py-20 bg-netflix-deepBlack border-t-8 border-netflix-gray/20">
      <div className="max-w-[1920px] mx-auto px-4 md:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8 flex justify-between items-end"
        >
          <div>
            <h2 className="text-2xl md:text-4xl font-bold mb-2">
              Hiện đang thịnh hành
            </h2>
            <p className="text-netflix-lightGray text-sm md:text-base">
              Phim và series đang được yêu thích nhất
            </p>
          </div>

          {/* Navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-netflix-lightGray text-sm">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={currentPage >= totalPages - 1}
                className="p-3 bg-netflix-gray/30 hover:bg-netflix-gray/50 disabled:opacity-30 disabled:cursor-not-allowed rounded-full transition-all duration-300 hover:scale-110"
              >
                <FaChevronRight className="text-white" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Movies Grid with Animation */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4"
            >
              {currentMovies.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, zIndex: 10 }}
                  className="relative group cursor-pointer"
                >
                  {/* Rank Number */}
                  <div className="absolute -left-2 -bottom-2 z-20 text-7xl md:text-9xl font-black text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] leading-none pointer-events-none">
                    <span className="bg-gradient-to-b from-transparent via-black/50 to-black bg-clip-text text-transparent [-webkit-text-stroke:2px_white]">
                      {currentPage * MOVIES_PER_PAGE + index + 1}
                    </span>
                  </div>

                  {/* Movie Poster */}
                  <div className="relative overflow-hidden rounded-md">
                    <img
                      src={getImageUrl(movie.poster_path, "w500")}
                      alt={movie.title || movie.name}
                      className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />

                    {/* Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                        <h3 className="text-sm md:text-base font-bold mb-2 line-clamp-2">
                          {movie.title || movie.name}
                        </h3>

                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs md:text-sm text-green-500 font-semibold">
                            {Math.round(movie.vote_average * 10)}% Match
                          </span>
                          <span className="text-xs md:text-sm text-netflix-lightGray">
                            {new Date(
                              movie.release_date || movie.first_air_date
                            ).getFullYear()}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button className="flex-1 flex items-center justify-center gap-1 bg-netflix-white text-netflix-deepBlack px-2 py-1.5 md:px-3 md:py-2 rounded text-xs md:text-sm font-semibold hover:bg-netflix-white/80 transition">
                            <FaPlay className="text-xs" />
                            <span className="hidden md:inline">Xem</span>
                          </button>
                          <button className="p-1.5 md:p-2 bg-netflix-gray/60 hover:bg-netflix-gray rounded-full transition">
                            <FaInfoCircle className="text-xs md:text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-netflix-lightGray mb-4">
            Đăng ký ngay để xem toàn bộ nội dung
          </p>
          <a
            href="/login"
            className="inline-block bg-netflix-red hover:bg-netflix-red/90 text-netflix-white px-8 py-3 rounded font-semibold transition"
          >
            Bắt đầu miễn phí
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default TrendingSection;
