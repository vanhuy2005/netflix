import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import YouTube from "react-youtube";
import {
  IoArrowBack,
  IoPlay,
  IoCloseOutline,
  IoNotifications,
} from "react-icons/io5";
import axios from "axios";

const Player = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State management
  const [videoKey, setVideoKey] = useState(null);
  const [movieInfo, setMovieInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  // Fetch movie data
  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch movie details
        const movieResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${id}`,
          {
            params: {
              api_key: TMDB_API_KEY,
              language: "vi-VN",
            },
          }
        );
        setMovieInfo(movieResponse.data);

        // Fetch trailers
        const videosResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/${id}/videos`,
          {
            params: {
              api_key: TMDB_API_KEY,
              language: "en-US",
            },
          }
        );

        const videos = videosResponse.data.results;
        const trailer =
          videos.find((v) => v.type === "Trailer" && v.site === "YouTube") ||
          videos.find((v) => v.type === "Teaser" && v.site === "YouTube") ||
          videos.find((v) => v.site === "YouTube");

        if (trailer) {
          setVideoKey(trailer.key);
        } else {
          setError("Rất tiếc, phim này chưa có trailer.");
        }
      } catch (err) {
        console.error("❌ Lỗi tải dữ liệu:", err.message);
        setError("Không thể tải thông tin phim. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [id, TMDB_API_KEY]);

  // YouTube player options
  const opts = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      controls: 1,
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
    },
  };

  // Event handlers
  const handlePlayClick = () => {
    if (videoKey) {
      setIsPlaying(true);
    }
  };

  const handleClosePlayer = () => {
    setIsPlaying(false);
    setPlayerReady(false);
  };

  const handlePlayerReady = () => {
    setPlayerReady(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#141414] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-netflix-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Helper function to convert runtime to hours and minutes
  const formatRuntime = (minutes) => {
    if (!minutes) return "";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Calculate match score based on vote average (Netflix style)
  const matchScore = movieInfo?.vote_average
    ? Math.round(movieInfo.vote_average * 10)
    : 0;

  // ERROR HANDLING: CASE 1 - Movie exists but no trailer (Show Hero Layout)
  if (movieInfo && !videoKey && !loading) {
    return (
      <div className="relative min-h-screen w-full bg-black overflow-hidden">
        {/* Background Image */}
        <img
          src={`https://image.tmdb.org/t/p/original${movieInfo.backdrop_path}`}
          alt={movieInfo.title}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-8 left-8 z-50 p-3 hover:bg-white/10 rounded-full transition-all duration-300 group"
        >
          <IoArrowBack
            size={28}
            className="text-white group-hover:scale-110 transition-transform"
          />
        </button>

        {/* Hero Content */}
        <div className="absolute top-[40%] left-[4%] md:left-[60px] z-10 max-w-2xl">
          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-2xl">
            {movieInfo.title}
          </h1>

          {/* Match Score */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#46d369] font-bold text-xl">
              {matchScore}% Phù hợp
            </span>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-gray-300 text-base mb-6">
            <span className="font-medium">
              {movieInfo.release_date?.split("-")[0]}
            </span>
            <span className="text-gray-500">•</span>
            <span className="px-2 py-0.5 border border-gray-500 text-xs font-semibold">
              {movieInfo.vote_average >= 7 ? "13+" : "18+"}
            </span>
            {movieInfo.runtime && (
              <>
                <span className="text-gray-500">•</span>
                <span>{formatRuntime(movieInfo.runtime)}</span>
              </>
            )}
          </div>

          {/* Overview */}
          <p className="text-lg text-gray-200 mb-6 max-w-xl line-clamp-3 leading-relaxed">
            {movieInfo.overview || "Chưa có mô tả."}
          </p>

          {/* Trailer Unavailable Button */}
          <div className="space-y-4">
            <button
              disabled
              className="flex items-center gap-3 bg-gray-500/50 text-white font-bold text-xl px-10 py-4 rounded-md cursor-not-allowed opacity-70"
            >
              <IoNotifications size={36} />
              <span>Trailer Unavailable</span>
            </button>
            <p className="text-gray-400 text-sm">
              Rất tiếc, trailer cho phim này chưa được cập nhật.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ERROR HANDLING: CASE 2 - Fatal Error (Network error or movie not found)
  if (error || !movieInfo) {
    return (
      <div className="relative min-h-screen w-full bg-black flex items-center justify-center">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-8 left-8 z-50 p-3 hover:bg-white/10 rounded-full transition-all duration-300 group"
        >
          <IoArrowBack
            size={28}
            className="text-white group-hover:scale-110 transition-transform"
          />
        </button>

        {/* Error Content - Netflix System Message Style */}
        <div className="text-center max-w-2xl px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pardon the interruption.
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed">
            We're having trouble playing this title right now. Please try again
            later or select a different title.
          </p>

          <button
            onClick={() => navigate("/browse")}
            className="px-10 py-4 bg-white hover:bg-gray-200 text-black font-bold text-lg rounded transition-all duration-300 hover:scale-105"
          >
            Netflix Home
          </button>
        </div>

        {/* Error Code - Bottom Right */}
        <div className="absolute bottom-8 right-8 text-gray-600 text-sm font-mono">
          Error Code: NSES-404
        </div>
      </div>
    );
  }

  return (
    <>
      {/* PART 1: HERO SECTION - Cinema Poster */}
      {!isPlaying && (
        <div className="fixed inset-0 bg-black overflow-hidden">
          {/* Background Image */}
          <img
            src={`https://image.tmdb.org/t/p/original${movieInfo.backdrop_path}`}
            alt={movieInfo.title}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Gradient Overlay - Stronger on left and bottom */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-8 left-8 z-50 p-3 hover:bg-white/10 rounded-full transition-all duration-300 group"
          >
            <IoArrowBack
              size={28}
              className="text-white group-hover:scale-110 transition-transform"
            />
          </button>

          {/* Hero Content */}
          <div className="absolute top-[40%] left-[4%] md:left-[60px] z-10 max-w-2xl">
            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-2xl">
              {movieInfo.title}
            </h1>

            {/* Match Score (Netflix 2025 Style) */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[#46d369] font-bold text-xl">
                {matchScore}% Phù hợp
              </span>
            </div>

            {/* Metadata - Year | Age Rating | Duration */}
            <div className="flex items-center gap-3 text-gray-300 text-base mb-6">
              <span className="font-medium">
                {movieInfo.release_date?.split("-")[0]}
              </span>
              <span className="text-gray-500">•</span>
              <span className="px-2 py-0.5 border border-gray-500 text-xs font-semibold">
                {movieInfo.vote_average >= 7 ? "13+" : "18+"}
              </span>
              {movieInfo.runtime && (
                <>
                  <span className="text-gray-500">•</span>
                  <span>{formatRuntime(movieInfo.runtime)}</span>
                </>
              )}
            </div>

            {/* Overview */}
            <p className="text-lg text-gray-200 mb-8 max-w-xl line-clamp-3 leading-relaxed">
              {movieInfo.overview || "Chưa có mô tả."}
            </p>

            {/* Play Button - Netflix Style (White bg, black text) */}
            {videoKey && (
              <button
                onClick={handlePlayClick}
                className="group flex items-center gap-3 bg-white hover:bg-opacity-80 text-black font-bold text-xl px-10 py-4 rounded-md transition-all duration-300 hover:scale-105 shadow-2xl"
              >
                <IoPlay
                  size={36}
                  className="group-hover:scale-110 transition-transform"
                />
                <span>Phát</span>
              </button>
            )}

            {!videoKey && (
              <div className="inline-block px-6 py-3 bg-gray-800 text-gray-400 rounded-md text-lg">
                Trailer chưa có sẵn
              </div>
            )}
          </div>
        </div>
      )}

      {/* PART 2: THEATER MODE - Fullscreen Player */}
      {isPlaying && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Close Button - Improved */}
          <button
            onClick={handleClosePlayer}
            className="fixed top-8 right-8 z-[60] w-12 h-12 rounded-full hover:bg-white/20 transition-all duration-300 flex items-center justify-center cursor-pointer group"
          >
            <IoCloseOutline
              size={36}
              className="text-white group-hover:scale-110 group-hover:rotate-90 transition-all"
            />
          </button>

          {/* Loading Spinner */}
          {!playerReady && (
            <div className="absolute inset-0 flex items-center justify-center z-40">
              <div className="w-20 h-20 border-4 border-netflix-red border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* YouTube Player */}
          <div className="w-full h-full flex items-center justify-center">
            <YouTube
              videoId={videoKey}
              opts={opts}
              onReady={handlePlayerReady}
              onError={(e) => {
                console.error("❌ Lỗi phát video:", e);
                setError("Không thể phát video. Vui lòng thử lại.");
                setIsPlaying(false);
              }}
              className="w-full h-full"
              iframeClassName="w-full h-full"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Player;
