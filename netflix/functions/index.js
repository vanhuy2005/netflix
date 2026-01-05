const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
require('dotenv').config();

admin.initializeApp();
const db = admin.firestore();

// TMDB API Configuration (using dotenv - NO HARDCODED KEYS)
const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3";
// CẤU HÌNH CACHE HAI TỐC ĐỘ
const CACHE_DURATION_STABLE = 1000 * 60 * 45; // 45 phút (Cho user ổn định)
const CACHE_DURATION_VOLATILE = 1000 * 60 * 1; // 1 phút (Cho user đang cày phim)
if (!TMDB_KEY) {
  console.error("❌ [CRITICAL] TMDB_API_KEY not found in environment!");
  throw new Error("TMDB_API_KEY is required in .env file");
}

console.log("🔑 [Init] TMDB Key:", `✅ ${TMDB_KEY.substring(0, 8)}...`);
console.log("🌐 [Init] TMDB URL:", TMDB_BASE_URL);

// --- HELPER: Fetch TMDB Safe (with Retry) ---
const safeFetchRecommendations = async (seedId, retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await axios.get(`${TMDB_BASE_URL}/movie/${seedId}/recommendations`, {
        params: { api_key: TMDB_KEY, language: "vi-VN", page: 1 },
        timeout: 10000 // 10s for international calls
      });
      if (attempt > 0) console.log(`✅ TMDB Success on retry ${attempt} for seed ${seedId}`);
      return res.data.results || [];
    } catch (e) { 
      console.error(`❌ TMDB Fail for seed ${seedId} (attempt ${attempt + 1}/${retries + 1}):`, e.message);
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      }
    }
  }
  return []; // All retries failed
};

exports.getSmartRecommendations = functions
  .region("asia-southeast1")
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onCall(async (data, context) => {
    
    // 1. Auth & Cache Check
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login required");
    const userId = context.auth.uid;
    const { profileId } = data;
    
    const cacheRef = db.doc(`users/${userId}/profiles/${profileId}/recs/feed`);
    const cacheSnap = await cacheRef.get();
    if (cacheSnap.exists) {
      const d = cacheSnap.data();
      const age = Date.now() - d.timestamp.toMillis();
      // Smart cache decision: short TTL for users with <5 history, stable TTL for others
      const cachedHistoryCount = d.payload?.historyCount || 0;
      const allowedDuration = cachedHistoryCount < 5 ? CACHE_DURATION_VOLATILE : CACHE_DURATION_STABLE;
      if (age < allowedDuration && d.payload?.movies?.length > 0) {
        console.log(`⚡ Serving from Firestore Cache (Age: ${Math.round(age/1000)}s, Count: ${cachedHistoryCount}, TTL: ${Math.round(allowedDuration/1000)}s)`);
        return d.payload;
      }
      console.log(`🔄 Cache expired or volatile (Age: ${Math.round(age/1000)}s, Limit: ${Math.round(allowedDuration/1000)}s) -> Recalculating...`);
    }

    console.log(`🧠 Calculating Recs for ${profileId}...`);

    // 2. FETCH DATA (Lấy cả History và Saved List)
    const historyRef = db.collection(`users/${userId}/profiles/${profileId}/watchHistory`);
    const savedRef = db.collection(`users/${userId}/profiles/${profileId}/savedShows`);
    const profileRef = db.doc(`users/${userId}/profiles/${profileId}`);
    
    let historySnap, savedSnap, profileSnap;
    
    try {
      // Try with orderBy first
      [historySnap, savedSnap, profileSnap] = await Promise.all([
        historyRef.orderBy("last_watched", "desc").limit(50).get(),
        savedRef.orderBy("createdAt", "desc").limit(20).get(),
        profileRef.get()
      ]);
      console.log(`📊 Query success: ${historySnap.size} history, ${savedSnap.size} saved`);
    } catch (error) {
      // Fallback: Get all documents without orderBy (index may be missing)
      console.warn(`⚠️ OrderBy failed (likely missing index), using fallback query:`, error.message);
      [historySnap, savedSnap, profileSnap] = await Promise.all([
        historyRef.limit(50).get(), // No orderBy - just get recent docs
        savedRef.limit(20).get(),
        profileRef.get()
      ]);
      console.log(`📊 Fallback query success: ${historySnap.size} history, ${savedSnap.size} saved`);
    }

    const historyDocs = historySnap.docs.map(doc => doc.data());
    const savedDocs = savedSnap.docs.map(doc => doc.data());
    
    console.log(`📚 History docs count: ${historyDocs.length}`);
    console.log(`📚 Sample history:`, historyDocs.slice(0, 2).map(m => ({ id: m.id, title: m.title })));

    // --- ADAPTIVE FILTERING LOGIC ---

    let seeds = [];
    let reason = "";
    let isMatureUser = false;

    // TRƯỜNG HỢP 1: NEW USER (0 History)
    if (historyDocs.length === 0) {
        console.log("Empty History -> Hiding Recommendation Row");
        return { movies: [], reason: "" };
    }

    // TRƯỜNG HỢP 2: EARLY STAGE (1-3 Phim)
    // CHIẾN THUẬT: "Vơ đũa cả nắm" (Exploration)
    // Accept ALL clicks as signals - mọi tín hiệu đều quý giá khi data khan hiếm
    else if (historyDocs.length < 4) {
        console.log("🌱 Early Stage: Accepting ALL clicks (Exploration Mode)");
        
        // Lấy tất cả (chỉ loại % = 0)
        seeds = historyDocs.filter(m => m.percentage > 0);
        
        const latestMovieTitle = historyDocs[0]?.title || "phim bạn vừa xem";
        
        if (historyDocs.length === 1) {
            reason = `Vì bạn đã click vào ${latestMovieTitle}`;
        } else if (historyDocs.length === 2) {
            reason = `Dựa trên ${seeds[0].title} và ${seeds[1].title}`;
        } else {
            reason = `Gợi ý từ các phim bạn vừa mở`;
        }
    } 
    
    // TRƯỜNG HỢP 3: MATURE USER (4+ Phim)
    // CHIẾN THUẬT: "Gạn đục khơi trong" (Precision)
    // Apply strict trailer filtering to remove noise
    else {
        isMatureUser = true;
        console.log("🎯 Mature User: Applying Strict Trailer-Filter (Precision Mode)");

        // A. LỌC THÔNG MINH (TRAILER VERSION)
        // 1. Tín hiệu mạnh (Strong Interest): Xem gần hết trailer (>70%)
        const strongSeeds = historyDocs.filter(m => m.percentage && m.percentage > 70);
        
        // 2. Tín hiệu trung bình (Medium Interest): Xem được đoạn đầu/giữa (>25%)
        const mediumSeeds = historyDocs.filter(m => 
          m.percentage && m.percentage > 25 && m.percentage <= 70
        );

        // 3. Chọn Pool: Ưu tiên Strong, thiếu thì lấy Medium
        let validSeeds = [...strongSeeds];
        
        if (validSeeds.length < 2) {
          validSeeds = [...validSeeds, ...mediumSeeds];
        }
        
        // FALLBACK: Nếu user toàn skip (<25%), lấy 3 phim mới nhất
        if (validSeeds.length === 0) {
          console.log("⚠️ High skip rate detected. Fallback to recent raw history.");
          validSeeds = historyDocs.slice(0, 3);
        }

        console.log(`📊 Filtered seeds: ${strongSeeds.length} strong + ${mediumSeeds.length} medium = ${validSeeds.length} total`);

        // B. Chọn Seeds (Short-term + Long-term + Saved List)
        const recentSeeds = validSeeds.slice(0, 3);

        // My List Injection
        let longTermSeeds = [];
        if (savedDocs.length > 0) {
          const randomSaved = savedDocs[Math.floor(Math.random() * savedDocs.length)];
          longTermSeeds.push(randomSaved);
          console.log(`📜 Injecting Saved: ${randomSaved.title}`);
        }

        seeds = [...recentSeeds, ...longTermSeeds];
        reason = `Dựa trên sở thích và danh sách của bạn`;
    }

    // 3. FETCH TMDB & SCORING
    // Tạo Blacklist NGHIÊM NGẶT (để không gợi ý lại phim đã xem/đã lưu)
    const watchedIds = new Set(historyDocs.map(m => {
      // Ensure consistent ID type (convert to number if possible)
      const id = typeof m.id === 'string' ? parseInt(m.id, 10) : m.id;
      return isNaN(id) ? m.id : id;
    }));
    
    const savedIdsSet = new Set(savedDocs.map(m => {
      const id = typeof m.id === 'string' ? parseInt(m.id, 10) : m.id;
      return isNaN(id) ? m.id : id;
    }));
    
    const blacklistIds = new Set([...watchedIds, ...savedIdsSet]);
    
    console.log(`🚫 Blacklist: ${blacklistIds.size} movies (${watchedIds.size} watched + ${savedIdsSet.size} saved)`);
    console.log(`🎬 Watched IDs:`, Array.from(watchedIds).slice(0, 5));
    console.log(`📚 Saved IDs:`, Array.from(savedIdsSet).slice(0, 5));

    let moviePool = {};

    if (seeds.length > 0) {
      const promises = seeds.map(seed => safeFetchRecommendations(seed.id));
      const resultsArray = await Promise.all(promises);

      resultsArray.forEach((results, idx) => {
        // TIME DECAY WEIGHTING (Exponential)
        // Seed 0: 2.0, Seed 1: 1.8, Seed 2: 1.62, Seed 3: 1.46...
        const weight = isMatureUser ? 2.0 * Math.pow(0.9, idx) : 1.0;

        results.forEach(movie => {
          // Normalize movie ID for comparison
          const movieId = typeof movie.id === 'string' ? parseInt(movie.id, 10) : movie.id;
          const normalizedId = isNaN(movieId) ? movie.id : movieId;
          
          // STRICT FILTERING: Skip if watched, saved, or no backdrop
          if (blacklistIds.has(normalizedId) || !movie.backdrop_path) {
            if (blacklistIds.has(normalizedId)) {
              console.log(`⚠️ Filtered blacklisted: ${movie.title || movie.name} (ID: ${normalizedId})`);
            }
            return;
          }

          if (!moviePool[movie.id]) {
            moviePool[movie.id] = { ...movie, score: 0, sources: 0 };
          }
          
          // HYBRID SCORING: Quality (vote_average) + Popularity (log scale)
          // Formula: Score = (VoteAverage × Weight) + log(Popularity)
          const voteScore = (movie.vote_average || 5) * weight;
          const popularityBoost = movie.popularity ? Math.log10(movie.popularity + 1) : 0;
          
          moviePool[movie.id].score += voteScore + popularityBoost;
          moviePool[movie.id].sources += 1;
        });
      });
      
      // Cross-match Boost: Nếu nhiều seed cùng gợi ý 1 phim -> Tăng điểm
      Object.values(moviePool).forEach(m => {
        if (m.sources > 1) m.score += 5;
      });
    }

    // 4. FINALIZING
    let finalMovies = Object.values(moviePool).sort((a, b) => b.score - a.score);

    // If empty results → Just hide the row (no fallback)
    if (finalMovies.length === 0) {
        console.log("⚠️ No recommendations available - hiding row");
        return { movies: [], reason: "" };
    }

    // FINAL VERIFICATION: Double-check no blacklisted movies
    const beforeFilter = finalMovies.length;
    finalMovies = finalMovies
      .filter(m => {
        const movieId = typeof m.id === 'string' ? parseInt(m.id, 10) : m.id;
        const normalizedId = isNaN(movieId) ? m.id : movieId;
        const isBlacklisted = blacklistIds.has(normalizedId);
        
        if (isBlacklisted) {
          console.log(`🚫 Final filter removed: ${m.title || m.name} (ID: ${normalizedId})`);
        }
        
        return !isBlacklisted;
      })
      .slice(0, 20);
    
    console.log(`✅ Final count: ${finalMovies.length} movies (filtered ${beforeFilter - finalMovies.length} duplicates)`);

    const payload = { 
      movies: finalMovies, 
      reason,
      historyCount: historyDocs.length // For dynamic cache control on client
    };
    
    console.log(`📊 Returning payload: ${finalMovies.length} movies, ${historyDocs.length} history items`);
    
    // Lưu Cache
    await cacheRef.set({ payload, timestamp: admin.firestore.FieldValue.serverTimestamp() });

    return payload;
  });