import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaPlay } from "react-icons/fa";
import { IoAdd, IoCheckmark } from "react-icons/io5";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  saveShow,
  removeShow,
  subscribeToSavedShows,
} from "../../config/firebase";
import { getImageUrl } from "../../utils/tmdbApi";

const MovieCard = ({ movie, isLarge = false }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedShows, setSavedShows] = useState([]);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to saved shows for real-time updates
  useEffect(() => {
    // CRITICAL FIX: Only subscribe when user exists AND profile is selected
    if (!user) {
      setSavedShows([]);
      return;
    }

    // Check if profile exists before subscribing
    const currentProfile = localStorage.getItem("current_profile");
    if (!currentProfile) {
      console.log(
        "No profile selected, skipping savedShows subscription in MovieCard"
      );
      setSavedShows([]);
      return;
    }

    const profile = JSON.parse(currentProfile);

    try {
      const unsubscribe = subscribeToSavedShows(user, profile.id, (shows) => {
        setSavedShows(shows);
      });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } catch (error) {
      console.error("Error subscribing to saved shows in MovieCard:", error);
      setSavedShows([]);
    }
  }, [user]);

  // Check if current movie is saved
  useEffect(() => {
    if (movie && savedShows.length > 0) {
      const saved = savedShows.some(
        (show) => String(show.id) === String(movie.id)
      );
      setIsSaved(saved);
    } else {
      setIsSaved(false);
    }
  }, [movie, savedShows]);

  const handlePlayClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    navigate(`/player/${movie.id}`);
  };

  // Handle toggle My List with proper event handling
  const handleToggleList = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      return;
    }

    // Get current profile
    const currentProfile = localStorage.getItem("current_profile");
    if (!currentProfile) {
      console.error("No profile selected in MovieCard");
      return;
    }

    const profile = JSON.parse(currentProfile);

    try {
      if (isSaved) {
        await removeShow(user, profile.id, movie.id);
      } else {
        await saveShow(user, profile.id, movie);
      }
    } catch (error) {
      console.error("Error toggling My List:", error);
    }
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
                className="p-2 md:p-2.5 bg-white rounded-full hover:bg-white/80 transition shadow-lg"
                title="Phát"
              >
                <FaPlay className="text-black text-xs md:text-sm" />
              </motion.button>

              {/* Add/Remove from My List Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleToggleList}
                className="p-2 md:p-2.5 bg-transparent border-2 border-white rounded-full hover:bg-white/20 transition-all shadow-lg"
                title={isSaved ? "Xóa khỏi danh sách" : "Thêm vào danh sách"}
              >
                {isSaved ? (
                  <IoCheckmark className="text-white text-xs md:text-sm" />
                ) : (
                  <IoAdd className="text-white text-xs md:text-sm" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard;
