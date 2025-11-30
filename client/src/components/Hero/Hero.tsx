import { motion } from "framer-motion";
import { useState, useEffect } from "react";
// @ts-expect-error - TMDB API is in JS
import { getTrending, getImageUrl } from "../../utils/tmdbApi";
// @ts-expect-error - Component is in JSX
import NetflixSpinner from "../common/NetflixSpinner";

interface HeroMovie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  backdrop_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
}

const Hero = () => {
  const [heroMovie, setHeroMovie] = useState<HeroMovie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroMovie = async () => {
      try {
        const data = await getTrending("movie", "day");
        const randomMovie = data.results[Math.floor(Math.random() * 5)];
        setHeroMovie(randomMovie);
      } catch (error) {
        console.error("Error fetching hero movie:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroMovie();
  }, []);

  if (loading) {
    return (
      <div className="relative h-[90vh] w-full flex items-center justify-center bg-netflix-deepBlack">
        <NetflixSpinner />
      </div>
    );
  }

  if (!heroMovie) {
    return null;
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="relative h-[90vh] w-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={getImageUrl(heroMovie.backdrop_path, "original")}
          alt={heroMovie.title || heroMovie.name}
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-deepBlack via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-netflix-deepBlack/90 via-netflix-deepBlack/40 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full px-8 md:px-16 max-w-[1920px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl"
        >
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl md:text-7xl font-black mb-6 drop-shadow-2xl"
          >
            {heroMovie.title || heroMovie.name}
          </motion.h1>

          {/* Movie Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex items-center gap-4 mb-4"
          >
            <span className="text-green-500 text-xl font-bold">
              {Math.round(heroMovie.vote_average * 10)}% Match
            </span>
            {(heroMovie.release_date || heroMovie.first_air_date) && (
              <span className="text-netflix-lightGray text-lg">
                {new Date(
                  heroMovie.release_date || heroMovie.first_air_date || ""
                ).getFullYear()}
              </span>
            )}
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-white text-base md:text-lg font-normal leading-relaxed mb-6 drop-shadow-lg"
          >
            {truncateText(heroMovie.overview, 200)}
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex items-center space-x-4"
          >
            {/* Play Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 bg-white text-black px-8 py-3 rounded-md font-semibold text-lg hover:bg-white/90 transition-all"
            >
              <img src="/assets/play_icon.png" alt="Play" className="h-6 w-6" />
              <span>Phát</span>
            </motion.button>

            {/* More Info Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 bg-netflix-gray/70 text-white px-8 py-3 rounded-md font-semibold text-lg hover:bg-netflix-gray/50 transition-all"
            >
              <img src="/assets/info_icon.png" alt="Info" className="h-6 w-6" />
              <span>Thông tin khác</span>
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Hero;
