import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import YouTube from "react-youtube";
import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  addToWatchHistory,
  updateWatchProgress,
  getSpecificMovieHistory,
} from "../../config/firebase";
import {
  IoArrowBack,
  IoPlay,
  IoPause,
  IoVolumeHigh,
  IoVolumeMute,
  IoReload,
} from "react-icons/io5";
import { getImageUrl } from "../../utils/tmdbApi";

const Player = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // State UI
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // State Data
  const [user, setUser] = useState(null);
  const [videoKey, setVideoKey] = useState(null);
  const [movieInfo, setMovieInfo] = useState(null);
  const [hasError, setHasError] = useState(false);

  // State Resume Logic
  const [initialStartTime, setInitialStartTime] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [isReadyToPlay, setIsReadyToPlay] = useState(false);

  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // 2. Data Fetching & Resume Logic
  useEffect(() => {
    const initPlayer = async () => {
      if (!id) return;
      try {
        const movieRes = await axios.get(
          `https://api.themoviedb.org/3/movie/${id}`,
          {
            params: { api_key: TMDB_API_KEY, language: "vi-VN" },
          }
        );
        setMovieInfo(movieRes.data);

        const videoRes = await axios
          .get(`https://api.themoviedb.org/3/movie/${id}/videos`, {
            params: { api_key: TMDB_API_KEY, language: "en-US" },
          })
          .catch(() => ({ data: { results: [] } }));

        const videos = videoRes.data.results || [];
        const trailer =
          videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
          videos.find((v) => v.site === "YouTube");

        if (trailer) {
          setVideoKey(trailer.key);
        } else {
          setHasError(true);
          setIsReadyToPlay(true);
          return;
        }

        if (auth.currentUser) {
          const currentProfile = localStorage.getItem("current_profile");
          if (currentProfile) {
            const profile = JSON.parse(currentProfile);
            const history = await getSpecificMovieHistory(
              auth.currentUser.uid,
              profile.id,
              id
            );

            if (history && history.progress > 10 && history.percentage < 95) {
              setInitialStartTime(history.progress);
              setShowResumePrompt(true);
              setIsReadyToPlay(false);
            } else {
              setInitialStartTime(0);
              setIsReadyToPlay(true);
            }
          } else {
            setIsReadyToPlay(true);
          }
        } else {
          setIsReadyToPlay(true);
        }
      } catch (err) {
        setHasError(true);
        setIsReadyToPlay(true);
      }
    };
    initPlayer();
  }, [id, TMDB_API_KEY]);

  // 3. Handlers
  const handleResume = () => {
    setShowResumePrompt(false);
    setIsReadyToPlay(true);
  };

  const handleRestart = () => {
    setInitialStartTime(0);
    setShowResumePrompt(false);
    setIsReadyToPlay(true);
  };

  const opts = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 0, // Vô hiệu hóa bàn phím YouTube (để dùng custom)
      fs: 0,
      iv_load_policy: 3, // Tắt chú thích
      modestbranding: 1,
      rel: 0, // Hạn chế video liên quan (nhưng không tắt hẳn được)
      showinfo: 0,
      start: Math.floor(initialStartTime),
    },
  };

  const onPlayerReady = (e) => {
    playerRef.current = e.target;
    setIsPlaying(true);
    if (user && movieInfo) {
      const profile = JSON.parse(localStorage.getItem("current_profile"));
      if (profile) {
        addToWatchHistory(user, profile.id, movieInfo);
        startProgressTracking(e.target, profile.id);
      }
    }
  };

  const onStateChange = (e) => {
    if (e.data === 1) setIsPlaying(true);
    if (e.data === 2 || e.data === 0) setIsPlaying(false);
  };

  const startProgressTracking = (player, profileId) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      try {
        if (player.getPlayerState() === 1) {
          const currentTime = player.getCurrentTime();
          const duration = player.getDuration();
          if (currentTime > 1 && duration > 0) {
            await updateWatchProgress(
              user,
              profileId,
              movieInfo,
              currentTime,
              duration
            );
          }
        }
      } catch (err) {}
    }, 5000);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showResumePrompt) setShowControls(false);
    }, 3000);
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!playerRef.current || showResumePrompt) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!playerRef.current) return;
    if (isMuted) playerRef.current.unMute();
    else playerRef.current.mute();
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // --- RENDER ---
  if (hasError) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <h2 className="text-2xl font-bold">Video không khả dụng</h2>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-white text-black font-bold rounded hover:bg-gray-200">Quay lại</button>
      </div>
    );
  }

  return (
    <div
      className="w-screen h-screen bg-black overflow-hidden relative group font-sans select-none"
      onMouseMove={handleMouseMove}
      onClick={togglePlay}
    >
      {/* 1. VIDEO LAYER */}
      {isReadyToPlay && videoKey ? (
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Scale 1.4 để cắt bớt UI thừa của Youtube */}
          <div className="w-full h-full scale-[1.40] transform origin-center">
            <YouTube
              videoId={videoKey}
              opts={opts}
              onReady={onPlayerReady}
              onStateChange={onStateChange}
              className="w-full h-full"
              iframeClassName="w-full h-full object-cover"
            />
          </div>
        </div>
      ) : (
        movieInfo?.backdrop_path && (
          <div className="absolute inset-0">
            <img src={getImageUrl(movieInfo.backdrop_path, "original")} alt="bg" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </div>
        )
      )}

      {/* --- MỚI: PAUSE OVERLAY (CHE KHUYẾT ĐIỂM) --- */}
      {/* Khi Pause: Hiện lớp mờ đen để che các video đề xuất của YouTube */}
      {isReadyToPlay && !isPlaying && !showResumePrompt && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-md transition-all duration-500">
           {/* Bạn có thể thêm nội dung phụ ở đây nếu muốn, hoặc để trống để chỉ lấy hiệu ứng mờ */}
        </div>
      )}

      {/* 2. RESUME PROMPT MODAL */}
      {showResumePrompt && movieInfo && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#181818] p-8 rounded-xl shadow-2xl max-w-md w-full border border-gray-700/50 text-center transform transition-all scale-100">
            <h2 className="text-white text-2xl font-bold mb-2">Tiếp tục xem?</h2>
            <p className="text-gray-400 text-sm mb-6">Bạn đang xem dở <span className="text-white font-medium">{movieInfo.title}</span></p>
            <div className="flex flex-col gap-3">
              <button onClick={(e) => { e.stopPropagation(); handleResume(); }} className="w-full py-3 bg-[#E50914] hover:bg-[#b20710] text-white font-bold rounded-md flex items-center justify-center gap-2 transition duration-200">
                <IoPlay size={20} /> Tiếp tục phát
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleRestart(); }} className="w-full py-3 bg-gray-600/50 hover:bg-gray-600 text-white font-bold rounded-md flex items-center justify-center gap-2 transition duration-200">
                <IoReload size={20} /> Xem lại từ đầu
              </button>
            </div>
            <button onClick={() => navigate(-1)} className="mt-6 text-gray-400 text-sm hover:text-white transition">Quay lại Trang chủ</button>
          </div>
        </div>
      )}

      {/* 3. UI OVERLAY (CONTROLS) */}
      {isReadyToPlay && !showResumePrompt && (
        <div className={`absolute inset-0 transition-opacity duration-500 z-50 ${showControls || !isPlaying ? "opacity-100 cursor-default" : "opacity-0 cursor-none"}`}>
          
          {/* TOP HEADER */}
          <div className="absolute top-0 left-0 w-full p-6 flex items-center gap-4 pointer-events-auto">
            <button onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="text-white hover:opacity-70 transition-transform transform active:scale-95">
              <IoArrowBack size={40} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.7))" }} />
            </button>
            {movieInfo && (
              <h1 className="text-white font-bold text-2xl tracking-wide opacity-90" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>{movieInfo.title}</h1>
            )}
          </div>

          {/* CENTER PLAY BUTTON */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Nút Play to ở giữa cũng giúp che bớt phần nào nếu blur chưa đủ */}
              <div className="bg-white/20 backdrop-blur-lg p-6 rounded-full border border-white/30 shadow-2xl transform transition scale-100">
                 <IoPlay className="text-white text-6xl ml-2 drop-shadow-lg" />
              </div>
            </div>
          )}

          {/* BOTTOM CONTROLS */}
          <div className="absolute bottom-0 left-0 w-full px-8 pb-8 pt-20 bg-gradient-to-t from-black/90 to-transparent flex items-end justify-between">
            <div className="flex items-center gap-8 pointer-events-auto">
              <button onClick={togglePlay} className="text-white hover:text-[#E50914] transition-colors duration-200 transform hover:scale-110">
                {isPlaying ? <IoPause size={40} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} /> : <IoPlay size={40} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />}
              </button>
              <button onClick={toggleMute} className="text-white hover:text-gray-300 transition-colors duration-200">
                {isMuted ? <IoVolumeMute size={32} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} /> : <IoVolumeHigh size={32} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {!isReadyToPlay && !showResumePrompt && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-12 h-12 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default Player;