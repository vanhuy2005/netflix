import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import YouTube from "react-youtube";
import { motion } from "framer-motion";
import { FaPlay, FaInfoCircle, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
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

const Billboard = () => {
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [user, setUser] = useState(null);
  const [savedShows, setSavedShows] = useState([]);
  const [isInList, setIsInList] = useState(false);

  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  useEffect(() => {
    const fetchBillboardMovie = async () => {
      try {
        setLoading(true);
        const response = await axios.get(requests.fetchTrending);

        // FAIL-SAFE: Filter valid movies only
        const validMovies = response.data.results.filter(
          (movie) =>
            movie.id &&
            movie.backdrop_path &&
            (movie.title || movie.name) &&
            movie.overview
        );

        if (validMovies.length === 0) {
          console.error("No valid movies found in trending");
          setLoading(false);
          return;
        }

        // Lấy phim ngẫu nhiên từ valid movies
        const randomMovie =
          validMovies[Math.floor(Math.random() * validMovies.length)];
        setMovie(randomMovie);

        // FAIL-SAFE: Fetch trailer with strict error handling
        try {
          const videosResponse = await axios.get(
            `https://api.themoviedb.org/3/${
              randomMovie.title ? "movie" : "tv"
            }/${randomMovie.id}/videos`,
            {
              params: {
                api_key: TMDB_API_KEY,
                language: "en-US",
              },
              timeout: 5000, // 5 second timeout
            }
          );

          const videos = videosResponse.data.results || [];
          const trailer =
            videos.find((v) => v.type === "Trailer" && v.site === "YouTube") ||
            videos.find((v) => v.type === "Teaser" && v.site === "YouTube") ||
            videos.find((v) => v.site === "YouTube");

          if (trailer) {
            setTrailerKey(trailer.key);
            // Delay showing video to allow smooth initial render
            setTimeout(() => setShowVideo(true), 1000);
          } else {
            // FAIL-SAFE: No trailer found -> Show backdrop image only
            console.log("No trailer available, showing backdrop only");
          }
        } catch (trailerError) {
          // FAIL-SAFE: Trailer fetch failed -> Silently fallback to backdrop
          console.log(
            "Trailer fetch failed, using backdrop:",
            trailerError.message
          );
          // Do NOT show error toast - just show backdrop image
        }
      } catch (error) {
        console.error("Error fetching billboard movie:", error);
        // FAIL-SAFE: Set a fallback movie if main fetch fails
        setMovie({
          id: "fallback",
          title: "Netflix Originals",
          overview: "Explore trending movies and series",
          backdrop_path: "/assets/hero_banner.jpg",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBillboardMovie();
  }, [TMDB_API_KEY]);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser?.email || "No user");
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
      console.log("No profile selected, skipping savedShows subscription");
      setSavedShows([]);
      return;
    }

    const profile = JSON.parse(currentProfile);
    console.log("Subscribing to saved shows for profile:", profile.id);

    try {
      const unsubscribe = subscribeToSavedShows(user, profile.id, (shows) => {
        console.log("Saved shows updated:", shows.length, "movies");
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

  // Check if current movie is in saved list
  useEffect(() => {
    if (movie && savedShows.length > 0) {
      const inList = savedShows.some(
        (show) => String(show.id) === String(movie.id)
      );
      console.log(
        `Movie ${movie.id} (${movie.title}) is ${inList ? "IN" : "NOT IN"} list`
      );
      setIsInList(inList);
    } else {
      setIsInList(false);
    }
  }, [movie, savedShows]);

  // YouTube player options for full-bleed video
  const opts = {
    playerVars: {
      autoplay: 1,
      controls: 0,
      rel: 0,
      showinfo: 0,
      mute: isMuted ? 1 : 0,
      loop: 1,
      playlist: trailerKey, // Required for loop to work
      modestbranding: 1,
      iv_load_policy: 3,
      disablekb: 1,
      fs: 0,
      playsinline: 1,
    },
  };

  if (loading || !movie) {
    return (
      <div className="relative h-[56.25vw] flex items-center justify-center bg-netflix-deepBlack">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-netflix-red"></div>
      </div>
    );
  }

  const truncateString = (str, num) => {
    if (!str) return "";
    if (str.length <= num) return str;
    return str.slice(0, num) + "...";
  };

  // Handle add/remove from My List
  const handleListToggle = async () => {
    if (!user || !user.uid) {
      console.warn("No user logged in, redirecting to login");
      navigate("/login");
      return;
    }

    // Get current profile
    const currentProfile = localStorage.getItem("current_profile");
    if (!currentProfile) {
      console.error("No profile selected");
      toast.error("Vui lòng chọn hồ sơ trước");
      navigate("/profiles");
      return;
    }

    if (!movie || !movie.id) {
      console.error("No movie data available");
      return;
    }

    const profile = JSON.parse(currentProfile);
    console.log(
      `Toggle list for movie: ${movie.title} (ID: ${movie.id}), profile: ${
        profile.id
      }, currently ${isInList ? "IN" : "NOT IN"} list`
    );

    try {
      if (isInList) {
        console.log("Removing from list...");
        await removeShow(user, profile.id, movie.id);
        // Toast already shown in removeShow function
      } else {
        console.log("Adding to list...");
        await saveShow(user, profile.id, movie);
        // Toast already shown in saveShow function
      }
    } catch (error) {
      console.error("Error toggling list:", error);
    }
  };

  return (
    <div className="relative h-[56.25vw] w-full overflow-hidden">
      {/* 1. VIDEO BACKGROUND LAYER (Z-0) - Full Bleed with Scale Hack */}
      {showVideo && trailerKey ? (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {/* Scale & Center Container - THE "COVER" HACK */}
          <div className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2">
            <YouTube
              videoId={trailerKey}
              className="w-full h-full"
              iframeClassName="w-full h-full"
              opts={opts}
            />
          </div>
        </div>
      ) : (
        // Fallback to static image if no trailer
        <div className="absolute inset-0">
          <img
            src={getImageUrl(
              movie.backdrop_path || movie.poster_path,
              "original"
            )}
            alt={movie.title || movie.name}
            className="w-full h-full object-cover object-center"
          />
        </div>
      )}

      {/* 2. GRADIENT OVERLAY LAYERS (Z-10) */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent z-10" />

      {/* 3. CONTENT LAYER (Z-20) */}
      <div className="absolute top-[30%] md:top-[40%] left-[4%] md:left-[60px] z-20 w-[90%] md:w-[40%]">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 drop-shadow-2xl">
            {movie.title || movie.name}
          </h1>

          {/* Match Score - Netflix 2025 Style */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#46d369] font-bold text-xl">
              {Math.round(movie.vote_average * 10)}% Phù hợp
            </span>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-gray-300 text-base mb-6">
            {movie.release_date && (
              <span className="font-medium">
                {new Date(
                  movie.release_date || movie.first_air_date
                ).getFullYear()}
              </span>
            )}
            {movie.adult !== undefined && (
              <>
                <span className="text-gray-500">•</span>
                <span className="px-2 py-0.5 border border-gray-500 text-xs font-semibold">
                  {movie.adult ? "18+" : "13+"}
                </span>
              </>
            )}
          </div>

          {/* Overview */}
          <p className="text-base md:text-lg text-gray-200 mb-8 line-clamp-3 max-w-xl drop-shadow-lg leading-relaxed">
            {truncateString(movie.overview, 150)}
          </p>

          {/* Buttons */}
          <div className="flex items-center gap-4">
            {/* Play Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/player/${movie.id}`)}
              className="flex items-center gap-3 bg-white text-black px-8 md:px-10 py-3 md:py-4 rounded font-bold text-lg md:text-xl hover:bg-white/90 transition-all shadow-2xl"
            >
              <FaPlay className="text-xl md:text-2xl" />
              <span>Phát</span>
            </motion.button>

            {/* Add to My List Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleListToggle}
              className="flex items-center justify-center bg-white/30 hover:bg-white/20 text-white w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white/50 transition-all backdrop-blur-sm shadow-lg"
              title={isInList ? "Xóa khỏi danh sách" : "Thêm vào danh sách"}
            >
              {isInList ? (
                <IoCheckmark className="text-2xl md:text-3xl" />
              ) : (
                <IoAdd className="text-2xl md:text-3xl" />
              )}
            </motion.button>

            {/* More Info Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 bg-gray-500/70 text-white px-6 md:px-8 py-3 md:py-4 rounded font-bold text-lg hover:bg-gray-500/50 transition-all backdrop-blur-sm shadow-lg"
            >
              <FaInfoCircle className="text-xl" />
              <span>Thông tin khác</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* 4. VOLUME CONTROL & AGE RATING (Z-30) */}
      {showVideo && trailerKey && (
        <div className="absolute right-[4%] md:right-[60px] bottom-[20%] z-30 flex items-center gap-4">
          {/* Mute/Unmute Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMuted(!isMuted)}
            className="border-2 border-white/50 rounded-full p-2 md:p-3 hover:bg-white/10 text-white transition-all backdrop-blur-sm"
            title={isMuted ? "Bật tiếng" : "Tắt tiếng"}
          >
            {isMuted ? (
              <FaVolumeMute className="text-xl md:text-2xl" />
            ) : (
              <FaVolumeUp className="text-xl md:text-2xl" />
            )}
          </motion.button>

          {/* Age Rating Badge */}
          <div className="bg-gray-500/50 border-l-4 border-white px-4 py-2 text-white text-sm font-bold backdrop-blur-sm">
            {movie.adult ? "18+" : "13+"}
          </div>
        </div>
      )}

      {/* Fade effect at bottom - Blend with rows below */}
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-netflix-deepBlack to-transparent z-10" />
    </div>
  );
};

export default Billboard;
