import { useState, useEffect } from "react";
import { getContinueWatching } from "../config/firebase";

/**
 * Continue Watching Hook (PHASE 2)
 * Fetches movies that user has partially watched (5% < progress < 95%)
 *
 * @param {Object} user - Firebase Auth user object
 * @param {string} profileId - Current profile ID
 * @returns {Object} { movies: Array, loading: boolean }
 */
export const useContinueWatching = (user, profileId) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profileId) {
      setMovies([]);
      setLoading(false);
      return;
    }

    const fetchContinueWatching = async () => {
      setLoading(true);
      try {
        console.log("▶️ [Continue] Fetching partially watched movies...");
        const data = await getContinueWatching(user.uid, profileId);
        setMovies(data);
        console.log(`✅ [Continue] Found ${data.length} movies to continue`);
      } catch (err) {
        console.error("❌ [Continue] Error:", err);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContinueWatching();
  }, [user, profileId]);

  return { movies, loading };
};
