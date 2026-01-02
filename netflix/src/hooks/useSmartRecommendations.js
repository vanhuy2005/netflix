import { useState, useEffect } from "react";
import axios from "axios";
import { getWatchHistory } from "../config/firebase";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

const CACHE_KEY_PREFIX = "netflix_recs_";
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

// PHASE 2: Time-based genre boosting
const getTimeContext = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
};

// PHASE 2: Genre preferences by time of day
const TIME_GENRE_BOOST = {
  morning: [16, 10751, 99], // Animation, Family, Documentary
  afternoon: [28, 12, 35], // Action, Adventure, Comedy
  evening: [27, 53, 18], // Horror, Thriller, Drama
};

/**
 * Smart Recommendations Hook
 * Implements Netflix-grade recommendation algorithm with:
 * - Time decay factor (recent watches weighted higher)
 * - Weighted scoring system (frequency + rating)
 * - Stale-while-revalidate caching
 * - Parallel API execution
 *
 * @param {Object} user - Firebase Auth user object
 * @param {string} profileId - Current profile ID
 * @returns {Object} { movies: Array, reason: string, loading: boolean }
 */
export const useSmartRecommendations = (user, profileId) => {
  const [data, setData] = useState({
    movies: [],
    reason: "",
    loading: true,
  });

  useEffect(() => {
    if (!user || !profileId) {
      setData({ movies: [], reason: "", loading: false });
      return;
    }

    const executeRecommendationEngine = async () => {
      try {
        // ========================================
        // STEP 1: Get Watch History (Seeds)
        // ========================================
        console.log("🎬 [Recs] Fetching watch history...");
        const history = await getWatchHistory(user, profileId, 3);

        if (history.length === 0) {
          console.log("📭 [Recs] No watch history found");
          setData({ movies: [], reason: "", loading: false });
          return;
        }

        console.log(
          `📚 [Recs] Found ${history.length} seed movies:`,
          history.map((h) => h.title)
        );

        // Generate seed signature for cache validation
        const seedSignature = history.map((h) => h.id).join("-");

        // ========================================
        // STEP 2: Check Cache (Performance Optimization)
        // ========================================
        const cacheKey = `${CACHE_KEY_PREFIX}${profileId}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            const age = Date.now() - parsed.timestamp;
            const isFresh = age < CACHE_DURATION;
            const isSameContext = parsed.seedSignature === seedSignature;

            console.log("💾 [Recs] Cache check:", {
              age: `${Math.round(age / 1000)}s`,
              isFresh,
              isSameContext,
            });

            if (isFresh && isSameContext) {
              console.log(
                "✅ [Recs] Using fresh cache - ZERO network requests"
              );
              setData({ ...parsed.payload, loading: false });
              return; // Early exit - maximum performance
            } else {
              console.log("🔄 [Recs] Cache stale/outdated - will revalidate");
              // Show stale cache first (instant UI), then revalidate
              setData({ ...parsed.payload, loading: true });
            }
          } catch (e) {
            console.warn("⚠️ [Recs] Cache parse error:", e);
            localStorage.removeItem(cacheKey);
          }
        }

        // ========================================
        // STEP 3: Time Decay Calculation
        // ========================================
        const now = Date.now();
        const seedsWithDecay = history.map((seed, index) => {
          // Calculate time since watched
          const lastWatched = seed.last_watched?.toMillis?.() || now;
          const ageInHours = (now - lastWatched) / (1000 * 60 * 60);

          // Decay formula: newer = higher weight
          // 0-24h: 1.0, 24-48h: 0.8, 48-72h: 0.6, etc.
          let decayFactor;
          if (ageInHours < 24) decayFactor = 1.0;
          else if (ageInHours < 48) decayFactor = 0.8;
          else if (ageInHours < 72) decayFactor = 0.6;
          else decayFactor = 0.4;

          // Position weight: first movie in history = highest priority
          const positionWeight = 1.0 - index * 0.2;

          const finalWeight = decayFactor * positionWeight;

          console.log(`⏰ [Recs] Seed ${seed.title}:`, {
            ageInHours: Math.round(ageInHours),
            decayFactor,
            positionWeight,
            finalWeight,
          });

          return { ...seed, weight: finalWeight };
        });

        // ========================================
        // STEP 4: Parallel API Fetching
        // ========================================
        console.log("🌐 [Recs] Fetching recommendations from TMDB...");

        const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
        const TMDB_BASE_URL = import.meta.env.VITE_TMDB_BASE_URL;

        // PHASE 2: Fetch My List (savedShows) for filtering
        const db = getFirestore();
        const savedRef = collection(
          db,
          "users",
          user.uid,
          "profiles",
          profileId,
          "savedShows"
        );
        const savedSnapshot = await getDocs(savedRef);
        const savedIds = new Set(
          savedSnapshot.docs.map((doc) => doc.data().id)
        );
        console.log(
          `📋 [Recs] My List has ${savedIds.size} movies (will filter out)`
        );

        // Use Promise.allSettled to prevent one failure from crashing all
        const requests = seedsWithDecay.map((seed) =>
          axios
            .get(`${TMDB_BASE_URL}/movie/${seed.id}/recommendations`, {
              params: {
                api_key: TMDB_API_KEY,
                language: "vi-VN",
              },
              timeout: 8000,
            })
            .then((res) => ({
              seed,
              results: res.data.results || [],
              status: "success",
            }))
            .catch((err) => {
              console.warn(
                `⚠️ [Recs] Failed to fetch for ${seed.title}:`,
                err.message
              );
              return {
                seed,
                results: [],
                status: "failed",
              };
            })
        );

        const responses = await Promise.allSettled(requests);
        const successfulResponses = responses
          .filter((r) => r.status === "fulfilled")
          .map((r) => r.value)
          .filter((r) => r.status === "success");

        console.log(
          `📦 [Recs] API responses: ${successfulResponses.length}/${requests.length} succeeded`
        );

        if (successfulResponses.length === 0) {
          console.error("❌ [Recs] All API requests failed");
          setData({
            movies: [],
            reason: "Unable to fetch recommendations",
            loading: false,
          });
          return;
        }

        // ========================================
        // STEP 5: Weighted Scoring Algorithm (PHASE 2 Enhanced)
        // ========================================
        console.log("🧮 [Recs] Calculating scores...");

        const moviePool = {};
        const seedIds = new Set(history.map((h) => h.id));

        // PHASE 2: Time-based genre boosting
        const timeContext = getTimeContext();
        const boostedGenres = TIME_GENRE_BOOST[timeContext];
        console.log(
          `🕐 [Recs] Time context: ${timeContext} → Boosting genres: ${boostedGenres}`
        );

        successfulResponses.forEach(({ seed, results }) => {
          const seedWeight = seed.weight;

          results.forEach((movie) => {
            // Quality gates
            if (!movie.id) return;
            if (seedIds.has(movie.id)) return; // Skip seed movies
            if (savedIds.has(movie.id)) return; // PHASE 2: Skip movies in My List
            if (!movie.backdrop_path) return; // Ensure visual quality

            // Initialize movie entry
            if (!moviePool[movie.id]) {
              moviePool[movie.id] = {
                ...movie,
                score: 0,
                frequency: 0,
                sources: [],
              };
            }

            // Scoring formula: S = (Frequency × W_freq) + (Rating × W_rating) + (SeedWeight × W_decay) + (Genre × W_genre)
            const W_freq = 10; // Frequency weight
            const W_rating = 0.5; // Rating weight (0-10 scale)
            const W_decay = 5; // Time decay weight
            const W_genre = 2; // PHASE 2: Genre boost weight

            const frequencyScore = 1 * W_freq; // Each appearance = +10 points
            const ratingScore = (movie.vote_average || 0) * W_rating; // Max +5 points
            const decayScore = seedWeight * W_decay; // Max +5 points

            // PHASE 2: Genre boost based on time of day
            let genreScore = 0;
            const hasBoostedGenre = movie.genre_ids?.some((id) =>
              boostedGenres.includes(id)
            );
            if (hasBoostedGenre) {
              genreScore = W_genre; // +2 points if genre matches time context
            }

            const totalScore =
              frequencyScore + ratingScore + decayScore + genreScore;

            moviePool[movie.id].score += totalScore;
            moviePool[movie.id].frequency += 1;
            moviePool[movie.id].sources.push(seed.title);
          });
        });

        // ========================================
        // STEP 6: Filtering & Deduplication
        // ========================================
        console.log(
          `🎯 [Recs] Pool size before filtering: ${
            Object.keys(moviePool).length
          }`
        );

        // PHASE 2: Quality filters already applied in Step 5:
        // - Removed movies in My List (savedIds)
        // - Removed seed movies (seedIds)
        // - Ensured backdrop_path exists

        // Sort by score and take top 20
        const finalMovies = Object.values(moviePool)
          .sort((a, b) => b.score - a.score)
          .slice(0, 20);

        console.log(
          `✨ [Recs] Final Recommendations: ${finalMovies.length} Movies`
        );
        console.log(
          "🏆 [Recs] Top 3:",
          finalMovies.slice(0, 3).map((m) => ({
            title: m.title,
            score: Math.round(m.score),
            frequency: m.frequency,
            rating: m.vote_average,
          }))
        );

        // ========================================
        // STEP 7: Generate Contextual Title (PHASE 2 Enhanced)
        // ========================================
        let contextTitle;

        // Prefer history-based contextual titles for 1-2 seeds
        if (history.length === 1) {
          contextTitle = `Because You watched ${history[0].title}`;
        } else if (history.length === 2) {
          contextTitle = `Because You Watched ${history[0].title} And ${history[1].title}`;
        } else {
          // Fall back to time-based titles for broader recommendations
          if (timeContext === "evening") {
            contextTitle = "Perfect For Tonight";
          } else if (timeContext === "morning") {
            contextTitle = "Start Your Day With";
          } else {
            contextTitle = `Top Picks For You`;
          }
        }

        const payload = {
          movies: finalMovies,
          reason: contextTitle,
        };

        // ========================================
        // STEP 8: Save Cache
        // ========================================
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              timestamp: Date.now(),
              seedSignature,
              payload,
            })
          );
          console.log("💾 [Recs] Cache updated");
        } catch (e) {
          console.warn("⚠️ [Recs] Failed to save cache:", e);
          // Continue without caching
        }

        // ========================================
        // STEP 9: Update UI State
        // ========================================
        setData({ ...payload, loading: false });
        console.log("✅ [Recs] Recommendation engine completed successfully");
      } catch (error) {
        console.error("❌ [Recs] Fatal error:", error);
        setData((prev) => ({ ...prev, loading: false }));
      }
    };

    executeRecommendationEngine();
  }, [user, profileId]);

  return data;
};
