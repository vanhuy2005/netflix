import { useRef, useState } from "react";
import { motion } from "framer-motion";
// @ts-expect-error - TMDB API is in JS
import { getImageUrl } from "../../utils/tmdbApi";

interface Movie {
  id: number;
  image?: string;
  name?: string;
  title?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

interface MovieRowProps {
  title: string;
  movies: Movie[];
}

const MovieRow = ({ title, movies }: MovieRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [scrollX, setScrollX] = useState(0);

  const handleScroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo =
        direction === "left"
          ? scrollLeft - clientWidth
          : scrollLeft + clientWidth;

      rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
      setScrollX(scrollTo);
    }
  };

  return (
    <div className="px-8 md:px-16 mb-8 group">
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="text-2xl font-bold text-white mb-4"
      >
        {title}
      </motion.h2>

      <div className="relative">
        {/* Left Arrow */}
        {scrollX > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-netflix-deepBlack/80 hover:bg-netflix-deepBlack/95 transition-all flex items-center justify-center"
          >
            <img
              src="/assets/back_arrow_icon.png"
              alt="Previous"
              className="h-8 w-8"
            />
          </motion.button>
        )}

        {/* Movies Container */}
        <div
          ref={rowRef}
          className="flex space-x-2 overflow-x-scroll scrollbar-hide scroll-smooth"
        >
          {movies.map((movie, index) => {
            const imageUrl =
              movie.image ||
              getImageUrl(movie.backdrop_path || movie.poster_path, "w500");
            const movieTitle = movie.name || movie.title || "Unknown";

            return (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{
                  scale: 1.05,
                  zIndex: 10,
                  transition: { duration: 0.3 },
                }}
                className="min-w-[200px] md:min-w-[280px] cursor-pointer relative group/card"
              >
                <img
                  src={imageUrl}
                  alt={movieTitle}
                  className="w-full h-[120px] md:h-[160px] object-cover rounded-md"
                  loading="lazy"
                />

                {/* Hover Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent rounded-md flex items-end p-4"
                >
                  <div className="w-full">
                    <h3 className="text-white font-semibold text-sm md:text-base mb-2 line-clamp-2">
                      {movieTitle}
                    </h3>
                    {movie.vote_average && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-500 text-xs font-semibold">
                          {Math.round(movie.vote_average * 10)}% Match
                        </span>
                        {(movie.release_date || movie.first_air_date) && (
                          <span className="text-netflix-lightGray text-xs">
                            {new Date(
                              movie.release_date || movie.first_air_date || ""
                            ).getFullYear()}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="bg-white text-black rounded-full p-2 hover:bg-white/90"
                      >
                        <img
                          src="/assets/play_icon.png"
                          alt="Play"
                          className="h-4 w-4"
                        />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Arrow */}
        <motion.button
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          onClick={() => handleScroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-netflix-deepBlack/80 hover:bg-netflix-deepBlack/95 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
        >
          <img
            src="/assets/back_arrow_icon.png"
            alt="Next"
            className="h-8 w-8 rotate-180"
          />
        </motion.button>
      </div>
    </div>
  );
};

export default MovieRow;
