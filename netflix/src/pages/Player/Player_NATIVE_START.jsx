import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import YouTube from "react-youtube";
import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { 
  auth, 
  addToWatchHistory, 
  updateWatchProgress, 
  getSpecificMovieHistory
} from "../../config/firebase";
import {
  IoArrowBack,
  IoVolumeHigh,
  IoVolumeMute,
  IoAlertCircleOutline,
} from "react-icons/io5";

const Player = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  // State
  const [user, setUser] = useState(null);
  const [videoKey, setVideoKey] = useState(null);
  const [movieInfo, setMovieInfo] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // [CRITICAL] State to manage native start
  const [initialStartTime, setInitialStartTime] = useState(null);
  const [isReadyToRenderPlayer, setIsReadyToRenderPlayer] = useState(false);

  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Movie Data & Resume Time (parallel)
  useEffect(() => {
    const initPlayer = async () => {
      if (!id) return;
      
      try {
        console.log(`🎬 [Player] Initializing for movie ${id}...`);
        
        // Fetch movie info and video key
        const [movieRes, videoRes] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
            params: { api_key: TMDB_API_KEY, language: "vi-VN" },
          }),
          axios.get(`https://api.themoviedb.org/3/movie/${id}/videos`, {
            params: { api_key: TMDB_API_KEY, language: "en-US" },
          }).catch(() => ({ data: { results: [] } })),
        ]);

        setMovieInfo(movieRes.data);

        // Find trailer
        const videos = videoRes.data.results || [];
        const trailer = videos.find(v => v.site === "YouTube" && v.type === "Trailer") || 
                        videos.find(v => v.site === "YouTube");
        
        if (trailer) {
          setVideoKey(trailer.key);
        } else {
          setHasError(true);
        }

        // [NEW LOGIC] Fetch resume time from Firebase
        let startTime = 0;
        if (auth.currentUser) {
          const currentProfile = localStorage.getItem("current_profile");
          if (currentProfile) {
            const profile = JSON.parse(currentProfile);
            const history = await getSpecificMovieHistory(auth.currentUser.uid, profile.id, id);
            
            if (history && history.progress && history.progress > 5) {
              // Only resume if > 5s and not finished
              if (history.percentage < 95) {
                startTime = history.progress;
                console.log(`⏩ [Native Resume] Found save point: ${startTime}s (${(history.percentage).toFixed(1)}%)`);
              } else {
                console.log(`✓ [Player] Movie already finished (${history.percentage}%), starting from beginning`);
              }
            } else {
              console.log(`ℹ️ [Player] No resume point found, starting from beginning`);
            }
          }
        }

        // Set start time and allow player render
        setInitialStartTime(startTime);
        setIsReadyToRenderPlayer(true);

      } catch (error) {
        console.error("❌ [Player] Init Error:", error);
        setHasError(true);
        setIsReadyToRenderPlayer(true);
      }
    };

    initPlayer();
  }, [id, TMDB_API_KEY]);

  // 3. YouTube Player Config
  const opts = {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      controls: 1,
      rel: 0,
      showinfo: 0,
      modestbranding: 1,
      iv_load_policy: 3,
      disablekb: 0,
      fs: 1,
      playsinline: 1,
      // [CRITICAL] YouTube starts from this second natively
      start: Math.floor(initialStartTime || 0), 
    },
  };

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    setIsPlaying(true);
    console.log(`✅ [Player] Ready! Starting at ${opts.playerVars.start}s`);
    
    // Start tracking after player ready
    if (user && movieInfo) {
      const currentProfile = localStorage.getItem("current_profile");
      if (currentProfile) {
        const profile = JSON.parse(currentProfile);
        addToWatchHistory(user, profile.id, movieInfo);
        startProgressTracking(event.target, profile.id);
      }
    }
  };

  const onStateChange = (event) => {
    const stateNames = {
      '-1': 'UNSTARTED', '0': 'ENDED', '1': 'PLAYING',
      '2': 'PAUSED', '3': 'BUFFERING', '5': 'CUED'
    };
    
    console.log(`🎮 [Player] State: ${stateNames[event.data]} (${event.data})`);
    
    if (event.data === 1) setIsPlaying(true);
    if (event.data === 2 || event.data === 0) setIsPlaying(false);
  };

  // Progress tracking logic
  const startProgressTracking = (player, profileId) => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    console.log("🚀 [Player] Starting progress tracking...");

    intervalRef.current = setInterval(async () => {
      try {
        if (!player || !user || !movieInfo) return;
        
        // Only save when playing
        const playerState = player.getPlayerState();
        if (playerState !== 1) return;

        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();

        if (currentTime > 1 && duration > 0) {
          console.log(`💾 [Player] Saving: ${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s`);
          await updateWatchProgress(user, profileId, movieInfo, currentTime, duration);
        }
      } catch (err) {
        console.warn("⚠️ Tracking error:", err);
      }
    }, 5000); 
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        console.log("🧹 [Player] Cleanup: Interval cleared");
      }
    };
  }, []);

  // UI Handlers
  const toggleMute = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
        console.log("🔊 [Player] Unmuted");
      } else {
        playerRef.current.mute();
        console.log("🔇 [Player] Muted");
      }
      setIsMuted(!isMuted);
    }
  };

  // --- RENDER ---

  // 1. Loading Screen (fetching data + resume time)
  if (!isReadyToRenderPlayer) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm animate-pulse">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // 2. Error Screen
  if (hasError || !videoKey) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <IoAlertCircleOutline className="text-6xl text-gray-500" />
        <h2 className="text-2xl font-bold">Không thể phát nội dung này</h2>
        <p className="text-gray-400 text-sm">Trailer có thể không khả dụng hoặc bị hạn chế khu vực</p>
        <button 
          onClick={() => navigate(-1)} 
          className="bg-white text-black px-6 py-2 font-bold rounded hover:bg-gray-200 transition mt-4"
        >
          <IoArrowBack className="inline mr-2" />
          Quay lại
        </button>
      </div>
    );
  }

  // 3. Main Player
  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative group font-sans">
      
      {/* Video Layer */}
      <div className="absolute inset-0 w-full h-full">
        <YouTube
          videoId={videoKey}
          opts={opts}
          onReady={onPlayerReady}
          onStateChange={onStateChange}
          className="w-full h-full"
          iframeClassName="w-full h-full"
        />
      </div>

      {/* Controls Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top gradient for visibility */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/80 to-transparent" />
        
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)} 
          className="pointer-events-auto absolute top-6 left-6 text-white hover:text-gray-300 transition flex items-center gap-2 z-50"
        >
          <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm hover:bg-black/70">
            <IoArrowBack size={24} />
          </div>
          <span className="font-bold drop-shadow-md hidden md:block">Quay lại</span>
        </button>

        {/* Movie title */}
        {movieInfo && (
          <div className="absolute top-6 right-6 z-50 hidden md:block">
             <h1 className="text-white/80 font-bold text-lg drop-shadow-md">{movieInfo.title}</h1>
          </div>
        )}
        
        {/* Mute button */}
        <button 
          onClick={toggleMute}
          className="pointer-events-auto absolute bottom-10 right-10 text-white z-50 bg-black/50 p-3 rounded-full hover:bg-white/20 transition backdrop-blur-sm"
        >
          {isMuted ? <IoVolumeMute size={24} /> : <IoVolumeHigh size={24} />}
        </button>

        {/* Resume indicator */}
        {initialStartTime > 0 && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/90 text-white px-6 py-3 rounded-lg border border-red-600 shadow-2xl animate-fade-in backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-300">Đang phát tiếp từ</span>
              <span className="font-bold text-red-500">
                {Math.floor(initialStartTime / 60)}:{String(Math.floor(initialStartTime % 60)).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Player;
