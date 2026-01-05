import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import YouTube from "react-youtube";
import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { auth, addToWatchHistory, updateWatchProgress } from "../../config/firebase";
import {
  IoArrowBack,
  IoVolumeHigh,
  IoVolumeMute,
  IoPlay,
  IoAlertCircleOutline,
} from "react-icons/io5";

const Player = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const playerRef = useRef(null);
  const watchTrackedRef = useRef(false);
  const intervalRef = useRef(null);
  const seekedRef = useRef(false); // Track if we've already seeked to resume position

  // [PHASE 2] Get resume position from navigation state (Continue Watching)
  const resumeData = location.state || {};
  const startTime = resumeData.startTime || 0;
  const isResuming = resumeData.resuming || false;

  const [user, setUser] = useState(null);
  const [videoKey, setVideoKey] = useState(null);
  const [movieInfo, setMovieInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);

  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setHasError(false);
        const [movieRes, videoRes] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
            params: { api_key: TMDB_API_KEY, language: "vi-VN" },
          }),
          axios
            .get(`https://api.themoviedb.org/3/movie/${id}/videos`, {
              params: { api_key: TMDB_API_KEY, language: "en-US" },
            })
            .catch(() => ({ data: { results: [] } })),
        ]);
        setMovieInfo(movieRes.data);
        const videos = videoRes.data.results || [];
        const trailer =
          videos.find((v) => v.type === "Trailer" && v.site === "YouTube") ||
          videos.find((v) => v.type === "Teaser" && v.site === "YouTube") ||
          videos.find((v) => v.site === "YouTube");
        if (trailer) setVideoKey(trailer.key);
        else setHasError(true);
      } catch (error) {
        console.error("Error:", error);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, TMDB_API_KEY]);

  // [DEBUG] Log resume data on component mount
  useEffect(() => {
    if (isResuming && startTime > 0) {
      console.log(`🎬 [Player] Resume mode activated:`, {
        startTime,
        formatted: `${Math.floor(startTime/60)}:${String(Math.floor(startTime%60)).padStart(2,'0')}`,
        movieId: id
      });
    }
  }, []);

  const opts = {
    height: "100%", width: "100%",
    playerVars: {
      autoplay: 1, controls: 0, rel: 0, showinfo: 0, modestbranding: 1,
      disablekb: 1, fs: 0, iv_load_policy: 3, mute: 1, playsinline: 1,
    },
  };

  // [FIX] Force play on state change if stuck
  const onPlayerStateChange = (event) => {
    const state = event.data;
    const stateNames = {
      '-1': 'UNSTARTED',
      '0': 'ENDED',
      '1': 'PLAYING',
      '2': 'PAUSED',
      '3': 'BUFFERING',
      '5': 'CUED'
    };
    
    console.log(`🎮 [Player] State changed to: ${stateNames[state]} (${state})`);
    
    // If stuck in BUFFERING/PAUSED after ready, force play
    if (state === 3 || state === 2) {
      setTimeout(() => {
        const currentTime = playerRef.current?.getCurrentTime();
        if (currentTime === 0 || currentTime === undefined) {
          console.warn("⚠️ [Player] Stuck! Forcing play again...");
          playerRef.current?.playVideo();
        }
      }, 1000);
    }
    
    if (state === 1) {
      setIsPlaying(true);
    } else if (state === 2 || state === 0) {
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    const playerState = playerRef.current.getPlayerState();
    if (playerState === 1) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
      console.log("⏸️ [Player] Paused");
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
      console.log("▶️ [Player] Manual play triggered - Video should start now!");
      
      // Verify it's actually playing
      setTimeout(() => {
        const currentTime = playerRef.current?.getCurrentTime();
        const state = playerRef.current?.getPlayerState();
        console.log("✅ [Player] Play status:", { currentTime, state, isPlaying: state === 1 });
      }, 1000);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (!playerRef.current) return;
    if (isMuted) playerRef.current.unMute();
    else playerRef.current.mute();
    setIsMuted(!isMuted);
  };

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    setIsPlaying(true);

    // [FIX] Force play with retry to bypass autoplay block
    const forcePlay = () => {
      try {
        event.target.playVideo();
        console.log("▶️ [Player] Forcing playback start...");
        
        // Verify after 500ms, retry if still at 0
        setTimeout(() => {
          const currentTime = event.target.getCurrentTime();
          const playerState = event.target.getPlayerState();
          console.log(`🔍 [Player] Verification:`, { currentTime, playerState });
          
          if (currentTime === 0 && playerState !== 1) {
            console.warn("⚠️ [Player] Still not playing, retrying...");
            event.target.playVideo();
          }
        }, 500);
      } catch (err) {
        console.warn("⚠️ [Player] Could not auto-play:", err);
      }
    };

    // Immediate play + delayed retry
    forcePlay();
    setTimeout(forcePlay, 1000); // Retry after 1s
    
    // [FIX] Auto unmute after 2s to bypass autoplay restrictions
    setTimeout(() => {
      try {
        event.target.unMute();
        setIsMuted(false);
        console.log("🔊 [Player] Auto unmuted to ensure playback");
      } catch (err) {
        console.warn("⚠️ [Player] Could not unmute:", err);
      }
    }, 2000);

    // [PHASE 2] Resume from saved position (Continue Watching)
    if (isResuming && startTime > 0 && !seekedRef.current) {
      // Immediate seek for faster response (YouTube player ready = can seek)
      try {
        event.target.seekTo(startTime, true);
        seekedRef.current = true;
        console.log(`⏩ [Player] Seeking to ${Math.floor(startTime)}s (${Math.floor(startTime/60)}:${String(Math.floor(startTime%60)).padStart(2,'0')})`);
        
        // Verify after 500ms
        setTimeout(() => {
          const currentTime = playerRef.current?.getCurrentTime();
          const duration = playerRef.current?.getDuration();
          console.log(`✅ [Player] Current position: ${Math.floor(currentTime)}s / ${Math.floor(duration)}s`);
        }, 500);
      } catch (err) {
        console.error("❌ [Player] Seek failed:", err);
      }
    }

    if (user && movieInfo && !watchTrackedRef.current) {
      const currentProfile = localStorage.getItem("current_profile");
      if (currentProfile) {
        try {
          const profile = JSON.parse(currentProfile);
          addToWatchHistory(user, profile.id, movieInfo);
          watchTrackedRef.current = true;
          startProgressTracking(event.target, profile.id);
        } catch (error) {
          console.error("❌ [Player] Failed to track:", error);
        }
      }
    }
  };

  // [FIX] Hàm tracking được cải tiến
  const startProgressTracking = (player, profileId) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    console.log("🚀 [Player] Starting progress tracking...", { profileId, hasPlayer: !!player });

    // Chờ 5s để player ổn định và bắt đầu play thật sự
    setTimeout(() => {
      console.log("⏱️ [Player] Progress tracking interval started (every 5s)");
      
      intervalRef.current = setInterval(async () => {
        try {
          if (!player || !user || !movieInfo) {
            console.warn("⚠️ [Player] Missing dependencies:", { 
              hasPlayer: !!player, 
              hasUser: !!user, 
              hasMovieInfo: !!movieInfo 
            });
            return;
          }

          const currentTime = player.getCurrentTime();
          const duration = player.getDuration();

          console.log(`🎥 [Player] Time values:`, { currentTime, duration });

          // [FIX] Only save if currentTime > 1s to avoid saving 0% repeatedly
          // This prevents Continue Watching from showing movies with 0% progress
          if (typeof currentTime === 'number' && !isNaN(currentTime) && currentTime > 1 && duration > 0 && !isNaN(duration)) {
            console.log(`💾 [Player] Saving progress: ${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s`);
            await updateWatchProgress(user, profileId, movieInfo, currentTime, duration);
          } else {
            console.warn("⚠️ [Player] Skipping save (too early or invalid):", { currentTime, duration });
          }
        } catch (err) {
          console.error("⚠️ Tracking error:", err);
        }
      }, 5000); 
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const debugProgress = () => {
    if (!playerRef.current) return;
    const currentTime = playerRef.current.getCurrentTime();
    const duration = playerRef.current.getDuration();
    const playerState = playerRef.current.getPlayerState();
    console.log("🐛 [DEBUG]:", {
      currentTime, duration, playerState,
      status: playerState === 1 ? "PLAYING" : "STOPPED/BUFFERING"
    });
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 md:w-16 md:h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (hasError || !videoKey) {
    return (
      <div className="relative w-screen h-screen bg-black overflow-hidden flex flex-col items-center justify-center p-4">
        {movieInfo?.backdrop_path && (
          <div className="absolute inset-0 opacity-30">
            <img src={`https://image.tmdb.org/t/p/original${movieInfo.backdrop_path}`} alt="Background" className="w-full h-full object-cover grayscale" />
          </div>
        )}
        <div className="z-10 text-center">
          <IoAlertCircleOutline className="text-gray-500 mb-4 mx-auto text-6xl md:text-8xl" />
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">Trailer chưa sẵn sàng</h2>
          <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 md:px-8 md:py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition flex items-center gap-2 mx-auto">
            <IoArrowBack /> Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative group font-sans select-none">
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden bg-black">
        <div className="relative w-full h-full md:w-[150%] md:h-[150%] md:-ml-[25%] md:-mt-[12%]">
          <YouTube
            videoId={videoKey}
            opts={opts}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            onEnd={() => setIsPlaying(false)}
            onError={() => setHasError(true)}
            className="w-full h-full opacity-100 md:opacity-90"
            iframeClassName="w-full h-full object-contain md:object-cover"
          />
        </div>
      </div>

      <div onClick={togglePlay} className="absolute inset-0 z-10 cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 md:from-black/60 md:to-black/40" />
        
        {/* Large Play Button - Always visible if not playing */}
        {!isPlaying && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-4">
            <div className="bg-red-600 p-6 md:p-8 rounded-full backdrop-blur-md border-4 border-white/30 shadow-2xl animate-pulse hover:scale-110 transition-transform pointer-events-auto cursor-pointer">
              <IoPlay className="text-white text-4xl md:text-6xl ml-2" />
            </div>
            <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-lg border border-white/20">
              <p className="text-white text-sm md:text-base font-semibold">
                Click để phát video
              </p>
            </div>
          </div>
        )}

        {/* [PHASE 2] Resume Indicator (shows for 3s when resuming) */}
        {isResuming && startTime > 0 && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-20 animate-fade-in">
            <div className="bg-black/90 backdrop-blur-md px-6 py-3 rounded-lg border border-red-600/50 shadow-2xl">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  Đang phát tiếp
                </span>
                <div className="flex items-center gap-2 text-white">
                  <IoPlay className="text-red-500 text-sm" />
                  <span className="text-xl font-bold">
                    {Math.floor(startTime / 60)}:{String(Math.floor(startTime % 60)).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <button onClick={() => navigate(-1)} className="absolute z-50 text-white/90 hover:text-white transition-all top-4 left-4 p-2 md:top-8 md:left-8 md:p-4 group flex items-center gap-3">
        <div className="bg-black/30 backdrop-blur-md rounded-full border border-white/10 p-2 md:p-3 hover:bg-white/20">
          <IoArrowBack className="text-xl md:text-2xl" />
        </div>
        <span className="hidden md:block font-medium text-lg opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">
          Quay lại
        </span>
      </button>

      <button onClick={toggleMute} className="absolute z-50 text-white hover:text-black transition-all bottom-4 right-4 p-3 md:bottom-10 md:right-10 md:p-4 bg-black/30 backdrop-blur-md rounded-full border border-white/10 hover:bg-white">
        {isMuted ? <IoVolumeMute className="text-xl md:text-2xl" /> : <IoVolumeHigh className="text-xl md:text-2xl" />}
      </button>

      {import.meta.env.DEV && (
        <button onClick={debugProgress} className="absolute z-50 bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-yellow-500/80 hover:bg-yellow-400 text-black font-bold rounded text-xs md:text-sm backdrop-blur-md border border-yellow-300">
          🐛 Fix 0% Bug
        </button>
      )}

      <div className="absolute left-4 bottom-4 right-16 md:left-10 md:bottom-10 md:right-auto z-20 pointer-events-none select-none">
        <p className="hidden md:block text-white/60 text-sm tracking-widest uppercase mb-1">Đang phát Trailer</p>
        <h1 className="text-white font-bold drop-shadow-lg leading-tight text-lg line-clamp-1 md:text-3xl md:line-clamp-none">
          {movieInfo?.title}
        </h1>
      </div>
    </div>
  );
};

export default Player;