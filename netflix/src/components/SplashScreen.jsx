import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTransition } from "../context/TransitionContext";

const SplashScreen = () => {
  const { isSplashing, endSplash } = useTransition();
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [shouldFadeOut, setShouldFadeOut] = useState(false);
  const videoRef = useRef(null);
  const safetyTimeoutRef = useRef(null);
  const unmountTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isSplashing) return;

    const video = videoRef.current;
    if (!video) return;

    // ============= EVENT HANDLERS =============

    const handleCanPlay = () => {
      setIsVideoLoaded(true);
      console.log("🎬 Video ready to play");

      // Log video duration to help debug
      if (video.duration) {
        console.log(`📹 Video duration: ${video.duration.toFixed(2)}s`);
      }
    };

    const handleEnded = () => {
      console.log("✅ Video ended naturally - Starting fade out");
      startFadeOut();
    };

    const handleError = (e) => {
      console.error("❌ Video error:", e);
      // On error, immediately end splash
      startFadeOut();
    };

    const handleSuspend = () => {
      console.warn("⚠️ Video suspended (iOS Low Power Mode?)");
      // If video suspends, wait a bit then fallback to safety timeout
    };

    // ============= SAFETY TIMEOUT =============
    // Extended timeout for full 16-second video playback
    // Gives 20 seconds total to ensure video completes + network buffer
    // Video should end naturally via onEnded event at ~16s
    safetyTimeoutRef.current = setTimeout(() => {
      console.warn("⏱️ Safety timeout triggered (20s) - Video may be stuck");
      startFadeOut();
    }, 20000); // 20 seconds to accommodate 16s video + 4s buffer

    // ============= FADE OUT LOGIC =============
    const startFadeOut = () => {
      // Clear safety timeout since video finished naturally
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        console.log("🛑 Safety timeout cleared - Video completed");
      }

      // Start fade out animation
      setShouldFadeOut(true);
      console.log("🌅 Starting fade out animation (800ms)");

      // After fade animation completes, end splash
      unmountTimeoutRef.current = setTimeout(() => {
        console.log("✨ Splash screen unmounting - Home page ready");
        endSplash();
      }, 800); // Increased from 500ms to 800ms for smoother fade
    };

    // ============= ATTACH LISTENERS =============
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);
    video.addEventListener("suspend", handleSuspend);

    // Try to play (modern browsers require user interaction, but we come from a click)
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.error("🚫 Autoplay prevented:", error);
        // If autoplay fails, trigger safety timeout immediately
        startFadeOut();
      });
    }

    // ============= CLEANUP =============
    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      video.removeEventListener("suspend", handleSuspend);

      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
      if (unmountTimeoutRef.current) {
        clearTimeout(unmountTimeoutRef.current);
      }
    };
  }, [isSplashing, endSplash]);

  return (
    <AnimatePresence>
      {isSplashing && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: shouldFadeOut ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            willChange: "opacity",
          }}
        >
          <video
            ref={videoRef}
            src="/assets/netflix-intro.mp4"
            muted
            playsInline
            preload="auto"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: isVideoLoaded ? 1 : 0,
              transition: "opacity 0.3s ease-in",
            }}
          />

          {/* Fallback for slow loading: Show black screen */}
          {!isVideoLoaded && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Optional: Netflix logo loader */}
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  border: "3px solid #333",
                  borderTop: "3px solid #e50914",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            </div>
          )}

          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
