import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import YouTube from "react-youtube";
import axios from "axios";
import {
  IoArrowBack,
  IoVolumeHigh,
  IoVolumeMute,
  IoPlay,
  IoAlertCircleOutline
} from "react-icons/io5";

const Player = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);

  // --- STATE ---
  const [videoKey, setVideoKey] = useState(null);
  const [movieInfo, setMovieInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);

  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setHasError(false);

        const [movieRes, videoRes] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
            params: { api_key: TMDB_API_KEY, language: "vi-VN" },
          }),
          axios.get(`https://api.themoviedb.org/3/movie/${id}/videos`, {
            params: { api_key: TMDB_API_KEY, language: "en-US" },
          }).catch(() => ({ data: { results: [] } }))
        ]);

        setMovieInfo(movieRes.data);

        const videos = videoRes.data.results || [];
        const trailer =
          videos.find((v) => v.type === "Trailer" && v.site === "YouTube") ||
          videos.find((v) => v.type === "Teaser" && v.site === "YouTube") ||
          videos.find((v) => v.site === "YouTube");

        if (trailer) {
          setVideoKey(trailer.key);
        } else {
          setHasError(true);
        }

      } catch (error) {
        console.error("Error:", error);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, TMDB_API_KEY]);

  // --- 2. PLAYER CONFIG ---
  const opts = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      controls: 0,
      rel: 0,
      showinfo: 0,
      modestbranding: 1,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      mute: 1,
      playsinline: 1, // Quan trọng cho Mobile (không tự fullscreen iOS)
    },
  };

  // --- 3. HANDLERS ---
  const togglePlay = () => {
    if (!playerRef.current) return;
    const playerState = playerRef.current.getPlayerState();
    if (playerState === 1) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
    } else {
      playerRef.current.mute();
    }
    setIsMuted(!isMuted);
  };

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    setIsPlaying(true);
  };

  // --- 4. RENDER LOADING ---
  if (loading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 md:w-16 md:h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- 5. RENDER ERROR / FALLBACK ---
  if (hasError || !videoKey) {
    return (
      <div className="relative w-screen h-screen bg-black overflow-hidden flex flex-col items-center justify-center p-4">
        {movieInfo?.backdrop_path && (
          <div className="absolute inset-0 opacity-30">
            <img
              src={`https://image.tmdb.org/t/p/original${movieInfo.backdrop_path}`}
              alt="Background"
              className="w-full h-full object-cover grayscale"
            />
          </div>
        )}
        <div className="z-10 text-center">
          <IoAlertCircleOutline className="text-gray-500 mb-4 mx-auto text-6xl md:text-8xl" />
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">Trailer chưa sẵn sàng</h2>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-2 md:px-8 md:py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition flex items-center gap-2 mx-auto"
          >
            <IoArrowBack /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  // --- 6. RENDER PLAYER (RESPONSIVE SUCCESS) ---
  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative group font-sans select-none">
      
      {/* ================= LAYER 1: VIDEO ================= */}
      {/* Responsive Logic:
          - Mobile: w-full h-full (Hiển thị trọn vẹn, không zoom để tránh mất hình dọc)
          - Tablet/Desktop (md trở lên): Zoom 150% để che UI Youtube
      */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden bg-black">
         <div className="relative w-full h-full md:w-[150%] md:h-[150%] md:-ml-[25%] md:-mt-[12%]">
            <YouTube
                videoId={videoKey}
                opts={opts}
                onReady={onPlayerReady}
                onEnd={() => setIsPlaying(false)} 
                onError={() => setHasError(true)}
                className="w-full h-full opacity-100 md:opacity-90"
                iframeClassName="w-full h-full object-contain md:object-cover" 
            />
            {/* object-contain cho mobile để thấy hết video, object-cover cho desktop để lấp đầy */}
         </div>
      </div>

      {/* ================= LAYER 2: INTERACTION (Touch Layer) ================= */}
      <div 
        onClick={togglePlay}
        className="absolute inset-0 z-10 cursor-pointer"
      >
        {/* Gradient: Đậm hơn ở Mobile để dễ đọc text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 md:from-black/60 md:to-black/40" />
        
        {/* Big Play Button (Center) */}
        {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/40 p-4 md:p-6 rounded-full backdrop-blur-md border border-white/20 animate-pulse">
                    <IoPlay className="text-white text-3xl md:text-5xl ml-1" />
                </div>
            </div>
        )}
      </div>

      {/* ================= LAYER 3: CONTROLS (Responsive Positioning) ================= */}
      
      {/* 1. Back Button */}
      {/* Mobile: top-4 left-4, nhỏ gọn. Desktop: top-8 left-8, to hơn */}
      <button
        onClick={() => navigate(-1)}
        className="absolute z-50 text-white/90 hover:text-white transition-all 
                   top-4 left-4 p-2 
                   md:top-8 md:left-8 md:p-4 group flex items-center gap-3"
      >
        <div className="bg-black/30 backdrop-blur-md rounded-full border border-white/10 p-2 md:p-3 hover:bg-white/20">
            <IoArrowBack className="text-xl md:text-2xl" />
        </div>
        {/* Chỉ hiện chữ "Back" trên Desktop */}
        <span className="hidden md:block font-medium text-lg opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">
            Quay lại
        </span>
      </button>

      {/* 2. Mute Button */}
      {/* Mobile: bottom-4 right-4. Desktop: bottom-10 right-10 */}
      <button
        onClick={toggleMute}
        className="absolute z-50 text-white hover:text-black transition-all 
                   bottom-4 right-4 p-3
                   md:bottom-10 md:right-10 md:p-4 
                   bg-black/30 backdrop-blur-md rounded-full border border-white/10 hover:bg-white"
      >
        {isMuted ? (
           <IoVolumeMute className="text-xl md:text-2xl" />
        ) : (
           <IoVolumeHigh className="text-xl md:text-2xl" />
        )}
      </button>

      {/* 3. Info Label */}
      {/* Mobile: Ẩn bớt text thừa, chỉ hiện Title nhỏ. Desktop: Hiện đầy đủ */}
      <div className="absolute left-4 bottom-4 right-16 md:left-10 md:bottom-10 md:right-auto z-20 pointer-events-none select-none">
          <p className="hidden md:block text-white/60 text-sm tracking-widest uppercase mb-1">
             Đang phát Trailer
          </p>
          <h1 className="text-white font-bold drop-shadow-lg leading-tight
                         text-lg line-clamp-1 
                         md:text-3xl md:line-clamp-none">
             {movieInfo?.title}
          </h1>
      </div>

    </div>
  );
};

export default Player;