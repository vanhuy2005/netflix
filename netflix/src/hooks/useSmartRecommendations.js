import { useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../config/firebase";

const CACHE_KEY_PREFIX = "netflix_recs_";

// Cấu hình thời gian Cache
const CACHE_DURATION_LONG = 1000 * 60 * 60 * 3; // 3 tiếng (Cho user ổn định)
const CACHE_DURATION_SHORT = 1000 * 60 * 2;     // 2 phút (Cho Fallback)
const CACHE_DURATION_RAPID = 1000 * 60 * 1;     // 1 phút (Cho New User đang cày phim)
const MAX_CACHE_AGE = 1000 * 60 * 60 * 24;      // 24 tiếng (Xóa hẳn nếu quá cũ)

// Khởi tạo Functions đúng vùng (Singapore)
const functions = getFunctions(app, "asia-southeast1");

/**
 * Smart Recommendations Hook - FINAL VERSION
 * - Tự động điều chỉnh thời gian cache dựa trên loại gợi ý.
 * - Lazy loading (chỉ chạy khi isEnabled = true).
 * - Tự động xóa cache hỏng.
 */
export const useSmartRecommendations = (user, profileId, isEnabled = true) => {
  const [data, setData] = useState({
    movies: [],
    reason: "",
    loading: false, 
  });

  useEffect(() => {
    // 1. Validation
    if (!user || !profileId) {
      setData({ movies: [], reason: "", loading: false });
      return;
    }

    // 2. Lazy Loading Check
    if (!isEnabled) {
      console.log("⏸️ [Recs] Hook disabled - waiting for scroll");
      return;
    }

    // 3. Clear cache when profileId changes (user switched profiles)
    const cacheKey = `${CACHE_KEY_PREFIX}${profileId}`;
    const clearStaleCache = () => {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const age = Date.now() - parsed.timestamp;
          // Clear if older than 2 minutes (allow fresh recalculation)
          if (age > 1000 * 60 * 2) {
            console.log("🗑️ [Recs] Clearing stale cache for fresh calculation");
            localStorage.removeItem(cacheKey);
          }
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }
    };
    
    clearStaleCache();

    // Bắt đầu loading
    setData(prev => ({ ...prev, loading: true }));

    const executeRecommendationEngine = async () => {
      try {
        // ========================================
        // STEP 1: Check Cache (Logic Thông Minh)
        // ========================================
        const cacheKey = `${CACHE_KEY_PREFIX}${profileId}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            const age = Date.now() - parsed.timestamp;
            
            // Xóa cache nếu quá cũ (> 24h)
            if (age > MAX_CACHE_AGE) {
              console.log("🗑️ [Recs] Cache corrupted/too old - removing");
              localStorage.removeItem(cacheKey);
            } else {
              // --- LOGIC MỚI: KIỂM TRA LOẠI CACHE ---
              const payload = parsed.payload;
              
              // 1. Check if fallback
              const isFallback = payload?.reason && (
                  payload.reason.toLowerCase().includes("phổ biến") || 
                  payload.reason.toLowerCase().includes("popular") ||
                  payload.reason.toLowerCase().includes("hãy xem vài phim")
              );
              
              // 2. [CRITICAL] Check if user is in rapid-change stage
              // If old cache doesn't have historyCount, default to 0 to force refresh
              const historyCount = payload.historyCount !== undefined ? payload.historyCount : 0;
              const isRapidChangeUser = historyCount < 5; // < 5 movies = rapid cache

              // 3. Dynamic cache duration based on user stage
              let dynamicDuration = CACHE_DURATION_LONG;
              let cacheMode = "✅ Stable User";
              
              if (isFallback) {
                dynamicDuration = CACHE_DURATION_SHORT;
                cacheMode = "⚠️ Fallback";
              } else if (isRapidChangeUser) {
                dynamicDuration = CACHE_DURATION_RAPID;
                cacheMode = `🚀 Rapid (${historyCount} movies)`;
              }
              
              const isFresh = age < dynamicDuration;

              console.log("💾 [Recs] Cache check:", {
                age: `${Math.round(age / 1000 / 60)}m`,
                maxAge: `${Math.round(dynamicDuration / 1000 / 60)}m`,
                mode: cacheMode,
                status: isFresh ? "FRESH" : "STALE",
                historyCount
              });

              if (isFresh) {
                console.log("✅ [Recs] Using fresh cache - ZERO network requests");
                setData({ ...payload, loading: false });
                return; // Thoát luôn, không gọi Server
              } else {
                console.log("🔄 [Recs] Cache stale - Revalidating...");
                // Hiển thị tạm cache cũ trong lúc chờ tải mới (Stale-while-revalidate)
                setData({ ...payload, loading: true });
              }
            }
          } catch (e) {
            console.warn("⚠️ [Recs] Cache parse error:", e);
            localStorage.removeItem(cacheKey);
          }
        }

        // ========================================
        // STEP 2: Call Cloud Function
        // ========================================
        console.log("☁️ [Recs] Calling Cloud Function...");
        
        const getRecommendations = httpsCallable(functions, "getSmartRecommendations");
        // Add timestamp to bypass any caching
        const result = await getRecommendations({ 
          profileId,
          timestamp: Date.now() // Force fresh calculation
        });
        const payload = result.data;

        if (!payload || !payload.movies || payload.movies.length === 0) {
          console.log("📭 [Recs] Server returned empty list");
          // Empty result → Component will hide itself (return null)
          setData({ 
            movies: [], 
            reason: "", 
            loading: false 
          });
          return;
        }

        console.log(`✨ [Recs] Received ${payload.movies.length} movies. Reason: "${payload.reason}"`);
        console.log(`📊 [Recs] History count: ${payload.historyCount || 'unknown'} movies`);

        // ========================================
        // STEP 3: Save Cache
        // ========================================
        try {
          const isRapid = (payload.historyCount || 0) < 5;
          const duration = isRapid ? CACHE_DURATION_RAPID : CACHE_DURATION_LONG;
          
          localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            payload,
          }));
          
          console.log(`💾 [Recs] Cache saved (${isRapid ? '🚀 Rapid' : '✅ Stable'}: ${Math.round(duration / 1000 / 60)}m)`);
        } catch (e) {
          console.warn("⚠️ [Recs] LocalStorage full/error:", e);
        }

        // ========================================
        // STEP 4: Update UI
        // ========================================
        setData({ ...payload, loading: false });

      } catch (error) {
        console.error("❌ [Recs] Error:", error);
        
        // Xử lý lỗi thân thiện
        let msg = "Không thể tải gợi ý lúc này.";
        if (error.code === "unauthenticated") msg = "Vui lòng đăng nhập lại.";
        if (error.code === "unavailable") msg = "Máy chủ đang bận.";

        setData({ movies: [], reason: msg, loading: false });
      }
    };

    executeRecommendationEngine();
  }, [user, profileId, isEnabled]);

  return data;
};