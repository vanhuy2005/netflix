import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import YouTube from "react-youtube";
import { FaPlay, FaChevronDown, FaInfoCircle } from "react-icons/fa";
import { IoAdd, IoCheckmark } from "react-icons/io5";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  saveShow,
  removeShow,
  subscribeToSavedShows,
} from "../../config/firebase";
import { getImageUrl } from "../../utils/tmdbApi";

const MovieCard = ({
  movie,
  isLarge = false,
  isFirst = false,
  isLast = false,
}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedShows, setSavedShows] = useState([]);

  // Hover expansion state
  const [isHovered, setIsHovered] = useState(false);
  const [showExpandedCard, setShowExpandedCard] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const hoverTimerRef = useRef(null);

  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to saved shows for real-time updates
  useEffect(() => {
    if (!user) {
      setSavedShows([]);
      return;
    }

    const currentProfile = localStorage.getItem("current_profile");
    if (!currentProfile) {
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
      console.error("Error subscribing to saved shows:", error);
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

  // Fetch trailer logic
  const fetchTrailer = async () => {
    if (!movie?.id || trailerKey) return;

    setIsLoadingTrailer(true);
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/${movie.title ? "movie" : "tv"}/${
          movie.id
        }/videos`,
        {
          params: {
            api_key: TMDB_API_KEY,
            language: "en-US",
          },
          timeout: 3000,
        }
      );

      const videos = response.data.results || [];
      const trailer =
        videos.find((v) => v.type === "Trailer" && v.site === "YouTube") ||
        videos.find((v) => v.type === "Teaser" && v.site === "YouTube") ||
        videos.find((v) => v.site === "YouTube");

      if (trailer) {
        setTrailerKey(trailer.key);
      }
    } catch (error) {
      console.log("Trailer fetch failed:", error.message);
    } finally {
      setIsLoadingTrailer(false);
    }
  };

  // PRODUCTION: 800ms Debounce to prevent API spam on rapid hover
  const handleMouseEnter = () => {
    setIsHovered(true);

    // CRITICAL FIX: 800ms debounce prevents network congestion
    // Only fetch trailer if user hovers intentionally (not quick swipes)
    hoverTimerRef.current = setTimeout(() => {
      setShowExpandedCard(true);
      fetchTrailer();
    }, 800);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowExpandedCard(false);
    setTrailerKey(null);

    // CRITICAL: Cancel pending timer immediately to prevent memory leaks & unwanted requests
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const handlePlayClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    navigate(`/player/${movie.id}`);
  };

  const handleToggleList = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    const currentProfile = localStorage.getItem("current_profile");
    if (!currentProfile) return;
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

  // Options for YouTube Player - HIDE ALL BRANDING
  const youtubeOpts = {
    playerVars: {
      autoplay: 1,
      controls: 0,
      rel: 0,
      showinfo: 0,
      mute: 1,
      loop: 1,
      modestbranding: 1,
      iv_load_policy: 3,
      disablekb: 1,
      playsinline: 1,
      origin: window.location.origin,
      fs: 0,
      cc_load_policy: 0,
      start: 5, // Skip intro
    },
  };

  return (
    <div
      className={`relative cursor-pointer flex-shrink-0 ${
        isLarge
          ? "w-[110px] md:w-[130px] lg:w-[145px]"
          : "w-[160px] md:w-[200px] lg:w-[230px]"
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        zIndex: showExpandedCard ? 50 : 1,
        isolation: "isolate",
      }}
    >
      {/* --- TRẠNG THÁI TĨNH (Static State) --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={`relative w-full overflow-hidden rounded-sm ${
          isLarge ? "aspect-[2/3]" : "aspect-video"
        }`}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 animate-shimmer rounded-sm" />
        )}
        <img
          src={getImageUrl(
            imagePath || fallbackImage,
            isLarge ? "w500" : "w780"
          )}
          alt={movie.title || movie.name}
          className={`w-full h-full object-cover transition-all duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          } ${isHovered ? "brightness-75" : "brightness-100"}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.target.src = getImageUrl(
              fallbackImage,
              isLarge ? "w500" : "w780"
            );
            setImageLoaded(true);
          }}
        />
      </motion.div>

      {/* --- EXPANDED STATE: Netflix/VieON Style --- */}
      <AnimatePresence>
        {showExpandedCard && (
          <motion.div
            initial={{ opacity: 0, scale: 1 }}
            animate={{
              opacity: 1,
              scale: isLarge ? 1.4 : 1.6,
              y: -20,
              x: isLast ? (isLarge ? -20 : -40) : 0,
            }}
            exit={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`absolute top-0 left-0 w-full z-50 ${
              isLarge ? "aspect-[2/3]" : "aspect-video"
            }`}
            style={{
              transformOrigin: isFirst
                ? "left top"
                : isLast
                ? "right top"
                : "center top",
            }}
          >
            <div
              className={`relative w-full overflow-hidden rounded-sm shadow-2xl shadow-black ${
                isLarge ? "aspect-[2/3]" : "aspect-video"
              }`}
            >
              {/* Media Layer */}
              {isLarge ? (
                <img
                  src={getImageUrl(movie.poster_path, "w780")}
                  alt={movie.title || movie.name}
                  className="w-full h-full object-cover"
                />
              ) : trailerKey && !isLoadingTrailer ? (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ transform: "scale(1.3)" }}
                >
                  <YouTube
                    videoId={trailerKey}
                    className="w-full h-full"
                    iframeClassName="w-full h-full"
                    opts={youtubeOpts}
                  />
                </div>
              ) : (
                <img
                  src={getImageUrl(
                    movie.backdrop_path || movie.poster_path,
                    "w780"
                  )}
                  alt={movie.title || movie.name}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Gradient Overlay - Subtle gradient for text readability */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-1.5 md:p-2">
                {/* Action Buttons Row */}
                <div className="flex items-center justify-center gap-1 mb-1">
                  {isLarge ? (
                    // NETFLIX ORIGINALS: Icon-only circular buttons
                    <>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handlePlayClick}
                        className="w-4 h-4 md:w-5 md:h-5 bg-white rounded-full flex items-center justify-center hover:bg-white/90 transition-all shadow-lg"
                      >
                        <FaPlay className="text-black text-[5px] md:text-[6px] ml-0.5" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1, borderColor: "#fff" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleToggleList}
                        className="w-4 h-4 md:w-5 md:h-5 bg-black/50 border border-gray-400 rounded-full flex items-center justify-center hover:border-white transition-all backdrop-blur-sm"
                      >
                        {isSaved ? (
                          <IoCheckmark className="text-white text-[7px] md:text-[8px]" />
                        ) : (
                          <IoAdd className="text-white text-[7px] md:text-[8px]" />
                        )}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1, borderColor: "#fff" }}
                        whileTap={{ scale: 0.9 }}
                        className="w-4 h-4 md:w-5 md:h-5 bg-black/50 border border-gray-400 rounded-full flex items-center justify-center hover:border-white transition-all backdrop-blur-sm"
                      >
                        <FaChevronDown className="text-white text-[5px] md:text-[6px]" />
                      </motion.button>
                    </>
                  ) : (
                    // REGULAR CARDS: Text buttons
                    <>
                      <motion.button
                        whileHover={{
                          scale: 1.05,
                          backgroundColor: "rgba(255,255,255,0.95)",
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePlayClick}
                        className="flex items-center gap-0.5 px-1.5 md:px-2 py-0.5 md:py-0.5 bg-white text-black hover:bg-white/90 transition-all shadow-md"
                      >
                        <FaPlay className="text-[5px] md:text-[6px]" />
                        <span className="text-[7px] md:text-[8px] font-semibold whitespace-nowrap">
                          Xem ngay
                        </span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05, borderColor: "#fff" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleToggleList}
                        className="flex items-center gap-0.5 px-1.5 md:px-2 py-0.5 md:py-0.5 bg-transparent border border-gray-400 text-white hover:border-white transition-all"
                      >
                        {isSaved ? (
                          <IoCheckmark className="text-[6px] md:text-[7px]" />
                        ) : (
                          <IoAdd className="text-[6px] md:text-[7px]" />
                        )}
                        <span className="text-[7px] md:text-[8px] font-medium whitespace-nowrap">
                          Danh sách
                        </span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05, borderColor: "#fff" }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-0.5 px-1.5 md:px-2 py-0.5 md:py-0.5 bg-transparent border border-gray-400 text-white hover:border-white transition-all"
                      >
                        <FaInfoCircle className="text-[6px] md:text-[7px]" />
                        <span className="text-[7px] md:text-[8px] font-medium whitespace-nowrap">
                          Chi tiết
                        </span>
                      </motion.button>
                    </>
                  )}
                </div>

                {/* Movie Metadata Row - VieON Style with separators */}
                <div className="flex items-center justify-center flex-wrap gap-x-1 text-[5px] md:text-[7px] text-gray-300">
                  <span className="text-white/90">
                    {new Date(
                      movie.release_date || movie.first_air_date
                    ).getFullYear()}
                  </span>
                  <span className="text-gray-500">|</span>
                  <span>{movie.adult ? "18+" : "T13"}</span>
                  <span className="text-gray-500">|</span>
                  <span>
                    {movie.original_language?.toUpperCase() === "VI"
                      ? "Việt Nam"
                      : movie.original_language?.toUpperCase() || "EN"}
                  </span>
                  <span className="text-gray-500">|</span>
                  <span>HD</span>
                  {movie.vote_average > 0 && (
                    <>
                      <span className="text-gray-500">|</span>
                      <span className="text-[#46d369]">
                        {movie.vote_average.toFixed(1)}★
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MovieCard;
