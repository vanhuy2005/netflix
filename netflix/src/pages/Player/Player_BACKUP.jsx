import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import screenfull from "screenfull";
import {
  IoArrowBack,
  IoPlay,
  IoPause,
  IoVolumeHigh,
  IoVolumeMute,
  IoExpand,
  IoContract,
} from "react-icons/io5";
import { BiSkipNext, BiRewind, BiCaptions, BiTachometer } from "react-icons/bi";
import axios from "axios";

const Player = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // State management
  const [videoKey, setVideoKey] = useState(null);
  const [movieInfo, setMovieInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Player controls state
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  // Fetch movie trailer
  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);

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

        // Fetch movie videos (trailers)
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

        // Try to find trailer, teaser, or any YouTube video
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
        console.error("Error fetching movie:", err.message);
        if (err.response?.status === 404) {
          setError("Không tìm thấy phim này.");
        } else {
          setError("Không thể tải video. Vui lòng thử lại sau.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [id, TMDB_API_KEY]);

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls && playing && isVideoReady) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, playing, isVideoReady]);

  // Handle mouse move to show controls
  const handleMouseMove = () => {
    if (isVideoReady) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  };

  // Start video playback
  const handleStartVideo = () => {
    console.log("Start video clicked!");
    setIsVideoReady(true);
    setMuted(false);
    // Use setTimeout to ensure state is updated before playing
    setTimeout(() => {
      console.log("Setting playing to true");
      setPlaying(true);
    }, 200);
  };

  // Player event handlers
  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleRewind = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(currentTime - 10, "seconds");
    }
  };

  const handleForward = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      playerRef.current.seekTo(currentTime + 10, "seconds");
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setMuted(newVolume === 0);
  };

  const handleToggleMute = () => {
    setMuted(!muted);
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekChange = (e) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e) => {
    setSeeking(false);
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(parseFloat(e.target.value));
    }
  };

  const handleProgress = (state) => {
    if (!seeking) {
      setPlayed(state.played);
    }
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  const handleToggleFullscreen = () => {
    if (screenfull.isEnabled) {
      screenfull.toggle(containerRef.current);
      setIsFullscreen(!isFullscreen);
    }
  };

  const formatTime = (seconds) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, "0");
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-netflix-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (error || !videoKey) {
    return (
      <div className="w-screen h-screen bg-[#141414] flex flex-col items-center justify-center relative">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, #E50914 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />
        </div>

        <div className="text-center max-w-2xl px-6 relative z-10">
          <div className="text-8xl mb-6 animate-bounce">😔</div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Oops!
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-8 leading-relaxed">
            {error || "Không thể tải video. Vui lòng thử lại sau."}
          </p>

          {movieInfo && (
            <div className="mb-8 p-4 bg-white/5 rounded-lg backdrop-blur-sm">
              <p className="text-white font-semibold text-lg">
                {movieInfo.title}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {movieInfo.release_date?.split("-")[0]} • Rating:{" "}
                {movieInfo.vote_average?.toFixed(1)}/10
              </p>
            </div>
          )}

          <button
            onClick={() => navigate(-1)}
            className="group px-10 py-4 bg-netflix-red hover:bg-[#c11119] rounded-md font-semibold text-white text-lg transition-all duration-300 flex items-center gap-3 mx-auto shadow-lg hover:shadow-netflix-red/50 hover:scale-105"
          >
            <IoArrowBack
              size={24}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full bg-black z-50"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && isVideoReady && setShowControls(false)}
    >
      {/* Back Button - Always visible */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 z-60 p-2 hover:bg-white/10 rounded-full transition-all duration-300 group"
      >
        <IoArrowBack
          size={32}
          className="text-white group-hover:scale-110 transition-transform"
        />
      </button>

      {/* Intro Screen - Shows before user clicks Play */}
      {!isVideoReady && movieInfo?.backdrop_path && (
        <div className="absolute inset-0 z-50">
          {/* Backdrop Image */}
          <img
            src={`https://image.tmdb.org/t/p/original${movieInfo.backdrop_path}`}
            alt={movieInfo.title}
            className="w-full h-full object-cover"
          />

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/50" />

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 max-w-4xl">
              {movieInfo.title}
            </h1>

            {/* Play Button */}
            <button
              onClick={handleStartVideo}
              className="group relative flex items-center justify-center w-24 h-24 bg-netflix-red hover:bg-[#c11119] rounded-full shadow-2xl hover:shadow-netflix-red/50 transition-all duration-300 hover:scale-110 animate-pulse hover:animate-none"
            >
              <IoPlay size={50} className="text-white ml-2" />
            </button>

            <p className="mt-6 text-gray-300 text-lg">Bấm để xem trailer</p>
          </div>
        </div>
      )}

      {/* Video Player Wrapper */}
      <div className="absolute top-0 left-0 w-full h-full z-10">
        <ReactPlayer
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${videoKey}`}
          width="100%"
          height="100%"
          playing={playing}
          volume={volume}
          muted={muted}
          controls={false}
          playsinline={true}
          progressInterval={1000}
          onProgress={handleProgress}
          onReady={() => {
            console.log("Player ready!");
            setPlayerReady(true);
            if (playerRef.current) {
              const videoDuration = playerRef.current.getDuration();
              setDuration(videoDuration);
            }
          }}
          onPlay={() => {
            setPlaying(true);
          }}
          onPause={() => {
            setPlaying(false);
          }}
          onEnded={() => {
            setIsVideoReady(false);
            setPlaying(false);
          }}
          onError={() => {
            setError("Không thể phát video.");
          }}
          config={{
            youtube: {
              playerVars: {
                autoplay: 0,
                controls: 0,
                rel: 0,
                modestbranding: 1,
                playsinline: 1,
              },
            },
          }}
        />
      </div>

      {/* Click Overlay for Play/Pause - Only show when video is ready */}
      {isVideoReady && (
        <div
          className="absolute inset-0 z-20 cursor-pointer"
          onClick={handlePlayPause}
        />
      )}

      {/* Top Gradient Overlay - Only show when video is ready */}
      {isVideoReady && (
        <div
          className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-40 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Bottom Controls - Only show when video is ready */}
      {isVideoReady && (
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-40 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="px-6 pb-6 pt-8">
            {/* Timeline Seekbar */}
            <div className="mb-3 group relative">
              <div className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-white text-black text-xs font-semibold px-2 py-1 rounded shadow-lg">
                  {formatTime(played * duration)}
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={0.999999}
                step="any"
                value={played}
                onMouseDown={handleSeekMouseDown}
                onChange={handleSeekChange}
                onMouseUp={handleSeekMouseUp}
                className="w-full h-1 bg-gray-700/50 rounded-full appearance-none cursor-pointer 
                [&::-webkit-slider-thumb]:appearance-none 
                [&::-webkit-slider-thumb]:w-4 
                [&::-webkit-slider-thumb]:h-4 
                [&::-webkit-slider-thumb]:rounded-full 
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:scale-0
                group-hover:[&::-webkit-slider-thumb]:scale-100
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:duration-200
                group-hover:h-1.5
                transition-all duration-200
                relative z-10"
                style={{
                  background: `linear-gradient(to right, #E50914 0%, #E50914 ${
                    played * 100
                  }%, rgba(75, 85, 99, 0.5) ${
                    played * 100
                  }%, rgba(75, 85, 99, 0.5) 100%)`,
                }}
              />
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayPause}
                  className="p-3 hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  {playing ? (
                    <IoPause size={32} className="text-white" />
                  ) : (
                    <IoPlay size={32} className="text-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleRewind}
                  className="p-2 hover:bg-white/10 rounded-full transition-all duration-300"
                >
                  <BiRewind size={24} className="text-white" />
                </button>

                <button
                  onClick={handleForward}
                  className="p-2 hover:bg-white/10 rounded-full transition-all duration-300"
                >
                  <BiSkipNext size={24} className="text-white" />
                </button>

                {/* Volume Control */}
                <div
                  className="relative flex items-center gap-2"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <button
                    onClick={handleToggleMute}
                    className="p-2 hover:bg-white/10 rounded-full transition-all duration-300"
                  >
                    {muted || volume === 0 ? (
                      <IoVolumeMute size={24} className="text-white" />
                    ) : (
                      <IoVolumeHigh size={24} className="text-white" />
                    )}
                  </button>

                  {showVolumeSlider && (
                    <div className="absolute left-full ml-2 bg-black/80 rounded-lg p-2">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={muted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-24 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none 
                        [&::-webkit-slider-thumb]:w-3 
                        [&::-webkit-slider-thumb]:h-3 
                        [&::-webkit-slider-thumb]:rounded-full 
                        [&::-webkit-slider-thumb]:bg-white"
                      />
                    </div>
                  )}
                </div>

                <div className="ml-4 flex items-center gap-2">
                  <span className="text-white font-bold text-sm">
                    {movieInfo?.title || "Đang phát"}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {formatTime(played * duration)} / {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-white/10 rounded-full transition-all duration-300">
                  <BiCaptions size={24} className="text-white" />
                </button>

                <button className="p-2 hover:bg-white/10 rounded-full transition-all duration-300">
                  <BiTachometer size={24} className="text-white" />
                </button>

                <button
                  onClick={handleToggleFullscreen}
                  className="p-2 hover:bg-white/10 rounded-full transition-all duration-300"
                >
                  {isFullscreen ? (
                    <IoContract size={24} className="text-white" />
                  ) : (
                    <IoExpand size={24} className="text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;
