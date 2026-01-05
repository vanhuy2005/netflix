import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import YouTube from "react-youtube";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlay,
  FaInfoCircle,
  FaVolumeUp,
  FaVolumeMute,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { IoAdd, IoCheckmark } from "react-icons/io5";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  saveShow,
  removeShow,
  subscribeToSavedShows,
} from "../../config/firebase";
import { getImageUrl } from "../../utils/tmdbApi";
import requests from "../../api/requests";
import { normalizeMovieId } from "../../utils/youtubeMap";

const Billboard = () => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [trailerKey, setTrailerKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [user, setUser] = useState(null);
  const [savedShows, setSavedShows] = useState([]);
  const [isInList, setIsInList] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
  const movie = useMemo(() => movies[currentIndex], [movies, currentIndex]);

  // --- FETCH MOVIES (Optimized with error handling) ---
  useEffect(() => {
    let isMounted = true;

    const fetchCarouselMovies = async () => {
      try {
        setLoading(true);
        const response = await axios.get(requests.fetchTrending, {
          timeout: 8000,
        });

        if (!isMounted) return;

        const validMovies = response.data.results
          .filter(
            (m) => m.id && m.backdrop_path && (m.title || m.name) && m.overview
          )
          .slice(0, 8);

        setMovies(validMovies.length > 0 ? validMovies : []);
      } catch (error) {
        console.error("Billboard fetch error:", error.message);
        if (isMounted) setMovies([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCarouselMovies();

    return () => {
      isMounted = false;
    };
  }, []);

  // --- FETCH TRAILER (Optimized to prevent unnecessary re-renders) ---
  useEffect(() => {
    if (!movie?.id) return;

    let isMounted = true;
    let videoTimer = null;

    const fetchTrailer = async () => {
      try {
        // Reset states immediately on movie change
        setShowVideo(false);
        setTrailerKey(null);

        const res = await axios.get(
          `https://api.themoviedb.org/3/${movie.title ? "movie" : "tv"}/${
            movie.id
          }/videos`,
          {
            params: { api_key: TMDB_API_KEY, language: "en-US" },
            timeout: 5000,
          }
        );

        if (!isMounted) return;

        const trailer =
          res.data.results.find(
            (v) => v.site === "YouTube" && v.type === "Trailer"
          ) || res.data.results.find((v) => v.site === "YouTube");

        if (trailer && isMounted) {
          setTrailerKey(trailer.key);
          videoTimer = setTimeout(() => {
            if (isMounted) setShowVideo(true);
          }, 1000);
        }
      } catch (e) {
        console.log("Trailer fetch failed:", e.message);
      }
    };

    fetchTrailer();

    return () => {
      isMounted = false;
      if (videoTimer) clearTimeout(videoTimer);
    };
  }, [movie?.id, TMDB_API_KEY]);

  // --- CAROUSEL NAVIGATION (Memoized callbacks) ---
  const handleNext = useCallback(() => {
    if (isTransitioning || movies.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % movies.length);
    setTimeout(() => setIsTransitioning(false), 800);
  }, [isTransitioning, movies.length]);

  const handlePrev = useCallback(() => {
    if (isTransitioning || movies.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
    setTimeout(() => setIsTransitioning(false), 800);
  }, [isTransitioning, movies.length]);

  // --- AUTO PLAY CAROUSEL (30 seconds) ---
  useEffect(() => {
    if (movies.length <= 1) return;
    const timer = setTimeout(handleNext, 30000);
    return () => clearTimeout(timer);
  }, [currentIndex, movies.length, handleNext]);

  // --- AUTH & LIST LOGIC ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setSavedShows([]);
      return;
    }
    const currentProfile = localStorage.getItem("current_profile");
    if (!currentProfile) return;
    const profile = JSON.parse(currentProfile);

    try {
      const unsubscribe = subscribeToSavedShows(user, profile.id, (shows) =>
        setSavedShows(shows)
      );
      return () => unsubscribe && unsubscribe();
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  useEffect(() => {
    if (movie && savedShows.length > 0) {
      const inList = savedShows.some(
        (show) => String(show.id) === String(movie.id)
      );
      setIsInList(inList);
    } else {
      setIsInList(false);
    }
  }, [movie, savedShows]);

  const handleListToggle = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    const currentProfile = localStorage.getItem("current_profile");
    if (!currentProfile) {
      navigate("/profiles");
      return;
    }
    const profile = JSON.parse(currentProfile);

    try {
      if (isInList) await removeShow(user, profile.id, movie.id);
      else await saveShow(user, profile.id, movie);
    } catch (error) {
      console.error(error);
    }
  };

  const truncateString = (str, num) => {
    if (!str) return "";
    return str.length > num ? str.slice(0, num) + "..." : str;
  };

  const opts = {
    playerVars: {
      autoplay: 1,
      controls: 0,
      rel: 0,
      showinfo: 0,
      mute: isMuted ? 1 : 0,
      loop: 1,
      playlist: trailerKey,
      modestbranding: 1,
      iv_load_policy: 3,
      disablekb: 1,
      fs: 0,
      playsinline: 1,
      // Fix: Set proper origin for localhost
      origin: window.location.origin,
      enablejsapi: 1,
    },
  };

  // YouTube Player Event Handlers (Fix: "not attached to DOM" warning)
  const onPlayerReady = (event) => {
    // Wait for DOM to be fully ready before API calls
    if (event.target && typeof event.target.playVideo === "function") {
      try {
        if (isMuted) {
          event.target.mute();
        }
        event.target.playVideo();
      } catch (err) {
        console.warn("YouTube player not ready:", err.message);
      }
    }
  };

  const onPlayerError = (event) => {
    console.warn("YouTube player error:", event.data);
    // Fallback to poster image on error
    setShowVideo(false);
  };

  if (loading || !movie) {
    return (
      <div className="h-screen min-h-[600px] bg-netflix-deepBlack animate-pulse" />
    );
  }

  return (
    // FULL VIEWPORT: Billboard chiếm toàn bộ màn hình, không thấy row khi ở đầu trang
    <div className="relative w-full h-screen min-h-[600px] overflow-hidden group bg-netflix-deepBlack">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {/* 1. VIDEO/IMAGE BACKGROUND - PRODUCTION FIX: Proper aspect-ratio wrapper */}
          <div className="absolute inset-0 overflow-hidden">
            {showVideo && trailerKey ? (
              // FIX: Use proper aspect-ratio scaling instead of arbitrary 300% width
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="relative w-full h-full min-w-full min-h-full"
                  style={{ aspectRatio: "16/9" }}
                >
                  <YouTube
                    videoId={trailerKey}
                    className="absolute inset-0 w-full h-full scale-150"
                    iframeClassName="w-full h-full"
                    opts={opts}
                    onReady={onPlayerReady}
                    onError={onPlayerError}
                  />
                </div>
              </div>
            ) : (
              <img
                src={getImageUrl(
                  movie?.backdrop_path || movie?.poster_path,
                  "original"
                )}
                alt={movie?.title || movie?.name}
                className="w-full h-full object-cover object-top md:object-center"
              />
            )}
          </div>

          {/* 2. GRADIENT OVERLAYS */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/90 via-[#141414]/40 to-transparent z-10" />
          <div className="absolute bottom-0 w-full h-[25%] bg-gradient-to-t from-[#141414] via-[#141414]/80 to-transparent z-10" />

          {/* 3. CONTENT - Nội dung nằm ở góc trái dưới, compact hơn */}
          <div className="absolute inset-0 z-20 flex flex-col justify-end pb-[15%] md:pb-[12%] lg:pb-[10%] px-[4%] md:px-[60px] pointer-events-none">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="max-w-md md:max-w-lg lg:max-w-xl w-full pointer-events-auto"
            >
              {/* TITLE: Compact hơn, chuyên nghiệp */}
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black mb-2 md:mb-4 drop-shadow-2xl leading-tight text-white">
                {movie?.title || movie?.name}
              </h1>

              {/* METADATA ROW */}
              <div className="flex items-center gap-2 md:gap-3 mb-3 text-[10px] md:text-sm font-medium">
                {movie?.vote_average && (
                  <span className="text-[#46d369]">
                    {Math.round(movie.vote_average * 10)}% Phù hợp
                  </span>
                )}
                <span className="text-gray-300">
                  {movie?.release_date?.substring(0, 4) ||
                    movie?.first_air_date?.substring(0, 4)}
                </span>
                <span className="border border-gray-400 px-1.5 py-0.5 text-gray-300 text-[9px] md:text-[10px] uppercase">
                  {movie?.adult ? "18+" : "HD"}
                </span>
              </div>

              {/* OVERVIEW: Compact hơn */}
              <p className="text-xs md:text-sm lg:text-base text-white/90 mb-4 line-clamp-2 md:line-clamp-3 drop-shadow-md">
                {truncateString(movie?.overview, 120)}
              </p>

              {/* BUTTONS - Bo tròn góc */}
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => {
                    const validId = normalizeMovieId(movie?.id);
                    console.log(`🔧 [Billboard] Play clicked: ${movie?.id} → ${validId}`);
                    navigate(`/player/${validId}`);
                  }}
                  className="flex items-center gap-1.5 md:gap-2 bg-white text-black px-3 md:px-5 py-1.5 md:py-2 hover:bg-white/90 transition font-bold text-xs md:text-sm"
                >
                  <FaPlay className="text-sm md:text-base" /> Phát
                </button>

                <button
                  onClick={handleListToggle}
                  className="w-8 h-8 md:w-10 md:h-10 border-2 border-white/40 rounded-full flex items-center justify-center text-white hover:border-white hover:bg-white/10 transition backdrop-blur-sm"
                >
                  {isInList ? <IoCheckmark size={16} /> : <IoAdd size={16} />}
                </button>

                <button className="flex items-center gap-1.5 md:gap-2 bg-gray-500/40 text-white px-3 md:px-5 py-1.5 md:py-2 hover:bg-gray-500/30 transition font-bold text-xs md:text-sm backdrop-blur-md">
                  <FaInfoCircle className="text-sm md:text-base" />
                  <span className="hidden md:inline">Thông tin khác</span>
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 4. VOLUME CONTROL & AGE RATING */}
      <div className="absolute right-[4%] md:right-[60px] bottom-[20%] md:bottom-[18%] z-50 flex items-center gap-2">
        {showVideo && trailerKey && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="w-9 h-9 md:w-10 md:h-10 border border-white/40 rounded-full flex items-center justify-center text-white/80 hover:text-white hover:border-white transition backdrop-blur-sm"
            title={isMuted ? "Bật tiếng" : "Tắt tiếng"}
          >
            {isMuted ? (
              <FaVolumeMute className="text-base md:text-lg" />
            ) : (
              <FaVolumeUp className="text-base md:text-lg" />
            )}
          </button>
        )}
        <div className="bg-gray-600/60 border-l-[3px] border-white px-2.5 md:px-3 py-1 md:py-1.5 text-white text-[11px] md:text-xs font-semibold rounded-sm">
          {movie?.adult ? "18+" : "13+"}
        </div>
      </div>

      {/* 5. CAROUSEL INDICATORS */}
      {movies.length > 1 && (
        <div className="absolute bottom-[12%] md:bottom-[10%] right-[4%] md:right-[60px] z-50 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handlePrev}
            disabled={isTransitioning}
            className="w-9 h-9 md:w-10 md:h-10 border border-white/40 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:border-white transition disabled:opacity-40"
          >
            <FaChevronLeft size={14} />
          </button>

          <div className="flex items-center gap-1">
            {movies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (!isTransitioning && idx !== currentIndex) {
                    setIsTransitioning(true);
                    setCurrentIndex(idx);
                    setTimeout(() => setIsTransitioning(false), 800);
                  }
                }}
                className={`h-[3px] rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "w-5 bg-white"
                    : "w-[6px] bg-gray-500 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={isTransitioning}
            className="w-9 h-9 md:w-10 md:h-10 border border-white/40 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:border-white transition disabled:opacity-40"
          >
            <FaChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Billboard;
