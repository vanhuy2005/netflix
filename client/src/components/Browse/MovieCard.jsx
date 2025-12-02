import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaPlay, FaPlus, FaChevronDown } from "react-icons/fa";
import { AiOutlineLike } from "react-icons/ai";
import { getImageUrl } from "../../utils/tmdbApi";

const MovieCard = ({ movie, isLarge = false }) => {
  const navigate = useNavigate();

  const handlePlayClick = (e) => {
    e.stopPropagation();
    navigate(`/player/${movie.id}`);
  };
  const imagePath = isLarge ? movie.poster_path : movie.backdrop_path;
  const fallbackImage = isLarge ? movie.backdrop_path : movie.poster_path;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.1, zIndex: 10 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      className={`relative group cursor-pointer flex-shrink-0 ${
        isLarge ? "w-[150px] md:w-[200px]" : "w-[250px] md:w-[300px]"
      }`}
    >
      {/* Movie Image */}
      <div
        className={`relative overflow-hidden rounded-md ${
          isLarge ? "aspect-[2/3]" : "aspect-video"
        }`}
      >
        <img
          src={getImageUrl(
            imagePath || fallbackImage,
            isLarge ? "w500" : "w780"
          )}
          alt={movie.title || movie.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.target.src = getImageUrl(
              fallbackImage,
              isLarge ? "w500" : "w780"
            );
          }}
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
            {/* Title */}
            <h3 className="text-white font-bold text-sm md:text-base mb-2 line-clamp-1">
              {movie.title || movie.name}
            </h3>

            {/* Metadata */}
            <div className="flex items-center gap-2 mb-3 text-xs">
              {movie.vote_average && (
                <span className="text-green-500 font-semibold">
                  {Math.round(movie.vote_average * 10)}% Phù hợp
                </span>
              )}
              {movie.release_date && (
                <span className="text-netflix-lightGray">
                  {new Date(
                    movie.release_date || movie.first_air_date
                  ).getFullYear()}
                </span>
              )}
              {movie.adult !== undefined && (
                <span className="border border-gray-400 px-1.5 py-0.5 text-[10px]">
                  {movie.adult ? "18+" : "13+"}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Play Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePlayClick}
                className="p-2 bg-white rounded-full hover:bg-white/80 transition"
                title="Phát"
              >
                <FaPlay className="text-black text-xs" />
              </motion.button>

              {/* Add to List */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-transparent border-2 border-gray-400 rounded-full hover:border-white transition"
                title="Thêm vào danh sách"
              >
                <FaPlus className="text-white text-xs" />
              </motion.button>

              {/* Like */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-transparent border-2 border-gray-400 rounded-full hover:border-white transition"
                title="Thích"
              >
                <AiOutlineLike className="text-white text-xs" />
              </motion.button>

              {/* More Info */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="ml-auto p-2 bg-transparent border-2 border-gray-400 rounded-full hover:border-white transition"
                title="Thông tin thêm"
              >
                <FaChevronDown className="text-white text-xs" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard;
