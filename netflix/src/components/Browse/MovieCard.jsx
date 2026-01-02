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
import { useModal } from "../../context/ModalContext";

const MovieCard = ({
  movie,
  isLarge = false,
  isFirst = false,
  isLast = false,
  fluid = false, // Hỗ trợ Grid Layout (Tìm kiếm)
  hideExpandedFooter = false, // When true, hide the expanded resume/footer (used by Continue Watching row)
}) => {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const [user, setUser] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedShows, setSavedShows] = useState([]);

  // Hover expansion state
  const [isHovered, setIsHovered] = useState(false);
  const [showExpandedCard, setShowExpandedCard] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // [UX IMPROVEMENT] Refs cho debounce timer
  const hoverTimerRef = useRef(null);
  const leaveTimerRef = useRef(null); // Timer để trì hoãn việc đóng thẻ

  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  // [PHASE 2] Lấy phần trăm đã xem từ dữ liệu Firestore (nếu có)
  const progressPercentage = movie.percentage || 0;
  const currentProgress = movie.progress || 0; // seconds watched
  const totalDuration = movie.duration || 0; // total seconds

  // Helper: Format seconds to MM:SS
  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper: Calculate time remaining
  const timeRemaining = totalDuration > 0 ? totalDuration - currentProgress : 0;

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

  // [UX IMPROVEMENT] Logic Hover thông minh (Debounce)
  const handleMouseEnter = () => {
    // 1. Hủy ngay lệnh đóng (nếu có) để giữ thẻ mở
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    setIsHovered(true);

    // 2. Nếu thẻ chưa mở, bắt đầu đếm ngược để mở (Debounce mở)
    if (!showExpandedCard) {
      hoverTimerRef.current = setTimeout(() => {
        setShowExpandedCard(true);
        fetchTrailer();
      }, 500); // 500ms delay trước khi mở
    }
  };

  const handleMouseLeave = () => {
    // 1. Hủy lệnh mở nếu chưa kịp mở
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    // 2. [QUAN TRỌNG] Set timer trễ 400ms để đóng
    leaveTimerRef.current = setTimeout(() => {
      setIsHovered(false);
      setShowExpandedCard(false);
      setTrailerKey(null);
    }, 400);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const handlePlayClick = (e) => {
    e.stopPropagation();
    e.preventDefault();

    // [SIMPLIFIED] Player will fetch resume data itself from Firebase
    // No need to pass state - cleaner and works even on refresh
    navigate(`/player/${movie.id}`);
    console.log(`▶️ [MovieCard] Navigating to player for movie ${movie.id}`);
  };

  const handleDetailsClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    openModal(movie);
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
      start: 10,
    },
  };

  const widthClass = fluid
    ? "w-full"
    : isLarge
    ? "w-[110px] md:w-[130px] lg:w-[145px]"
    : "w-[160px] md:w-[200px] lg:w-[230px]";

  return (
    <div
      className={`relative cursor-pointer flex-shrink-0 ${widthClass} pointer-events-auto hover:z-[100]`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        zIndex: showExpandedCard ? 50 : 1, // [FIX Z-INDEX] Khi mở thì z-index cao
        isolation: "isolate",
      }}
    >
      {/* =================================================================================
            TRẠNG THÁI TĨNH (STATIC CARD)
        ================================================================================= */}
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

        {/* [PHASE 2] PROGRESS BAR (STATIC) - Enhanced with time info */}
        {progressPercentage > 0 && !isHovered && !isLarge && (
          <div className="absolute bottom-0 left-0 right-0 z-10">
            {/* Progress bar with glow effect */}
            <div className="relative h-1.5 bg-gray-800/90 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-netflix-red via-netflix-redHover to-netflix-red shadow-[0_0_8px_rgba(229,9,20,0.6)] transition-all duration-300"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>

            {/* Time remaining label (bottom-left corner) */}
            <div className="absolute -top-6 left-2 text-[10px] font-bold text-white bg-black/80 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">
              {timeRemaining > 0
                ? `${formatTime(timeRemaining)} left`
                : "Watched"}
            </div>
          </div>
        )}
      </motion.div>

      {/* =================================================================================
            TRẠNG THÁI MỞ RỘNG (EXPANDED CARD)
        ================================================================================= */}
      <AnimatePresence>
        {showExpandedCard && (
          <motion.div
            // [FIX UX HOVER] Thêm onMouseEnter vào đây để đảm bảo khi chuột ở trên thẻ expanded, nó không bị đóng
            onMouseEnter={handleMouseEnter}
            initial={{ opacity: 0, scale: 1 }}
            animate={{
              opacity: 1,
              scale: fluid ? 1.4 : isLarge ? 1.4 : 1.6,
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
              willChange: "transform, opacity",
            }}
          >
            <div
              className={`relative w-full overflow-hidden rounded-sm bg-black shadow-none ${
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
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden bg-black">
                  <div className="w-[150%] h-[150%] flex items-center justify-center">
                    <YouTube
                      videoId={trailerKey}
                      className="w-full h-full"
                      iframeClassName="w-full h-full"
                      opts={youtubeOpts}
                      style={{ transform: "scale(1.8)" }}
                    />
                  </div>
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

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-1.5 md:p-2 bg-gradient-to-t from-black via-black/60 to-transparent">
                {/* Action Buttons Row */}
                <div className="flex items-center justify-center gap-1 mb-1">
                  {isLarge ? (
                    // NETFLIX ORIGINALS BUTTONS
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
                        onClick={handleDetailsClick}
                        className="w-4 h-4 md:w-5 md:h-5 bg-black/50 border border-gray-400 rounded-full flex items-center justify-center hover:border-white transition-all backdrop-blur-sm"
                      >
                        <FaChevronDown className="text-white text-[5px] md:text-[6px]" />
                      </motion.button>
                    </>
                  ) : (
                    // REGULAR CARDS BUTTONS
                    <>
                      <motion.button
                        whileHover={{
                          scale: 1.05,
                          backgroundColor: "rgba(255,255,255,0.95)",
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePlayClick}
                        className="flex items-center gap-0.5 px-1.5 md:px-2 py-0.5 md:py-0.5 bg-white text-black hover:bg-white/90 transition-all shadow-md rounded-[2px]"
                      >
                        <FaPlay className="text-[5px] md:text-[6px]" />
                        <span className="text-[7px] md:text-[8px] font-bold whitespace-nowrap">
                          Xem ngay
                        </span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05, borderColor: "#fff" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleToggleList}
                        className="flex items-center gap-0.5 px-1.5 md:px-2 py-0.5 md:py-0.5 bg-transparent border border-gray-400 text-white hover:border-white transition-all rounded-[2px]"
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
                        onClick={handleDetailsClick}
                        className="flex items-center gap-0.5 px-1.5 md:px-2 py-0.5 md:py-0.5 bg-transparent border border-gray-400 text-white hover:border-white transition-all rounded-[2px]"
                      >
                        <FaInfoCircle className="text-[6px] md:text-[7px]" />
                        <span className="text-[7px] md:text-[8px] font-medium whitespace-nowrap">
                          Chi tiết
                        </span>
                      </motion.button>
                    </>
                  )}
                </div>

                {/* Movie Metadata Row */}
                <div className="flex items-center justify-center flex-wrap gap-x-1 text-[5px] md:text-[7px] text-gray-300 drop-shadow-md">
                  <span className="text-white/90 font-semibold">
                    {new Date(
                      movie.release_date || movie.first_air_date
                    ).getFullYear()}
                  </span>
                  <span className="text-gray-500">|</span>
                  <span className="border border-gray-500 px-0.5 rounded-[1px]">
                    {movie.adult ? "18+" : "13+"}
                  </span>
                  <span className="text-gray-500">|</span>
                  <span className="text-white font-medium">
                    {movie.original_language?.toUpperCase() === "VI"
                      ? "Việt Nam"
                      : movie.original_language?.toUpperCase() || "EN"}
                  </span>
                  <span className="text-gray-500">|</span>
                  <span className="text-[#46d369] font-bold">
                    {Math.round(movie.vote_average * 10)}% Match
                  </span>
                </div>

                {/* [PHASE 2] PROGRESS BAR (EXPANDED) - Enhanced with resume info */}
                {progressPercentage > 0 && !hideExpandedFooter && (
                  <div className="mt-3 border-t border-gray-700/50 pt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-netflix-red">
                          \u25b6 Resume
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTime(currentProgress)} /{" "}
                          {formatTime(totalDuration)}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-white bg-netflix-red/20 px-2 py-0.5 rounded">
                        {Math.round(progressPercentage)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-netflix-red via-netflix-redHover to-netflix-red shadow-[0_0_8px_rgba(229,9,20,0.4)] transition-all duration-300"
                        style={{
                          width: `${Math.min(progressPercentage, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-gray-500 text-right">
                      {timeRemaining > 0
                        ? `${formatTime(timeRemaining)} remaining`
                        : "Completed"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MovieCard;
