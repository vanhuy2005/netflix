/**
 * Auto-Normalization System for Movie IDs
 * 
 * Purpose: Automatically validate and correct movie IDs without hardcoding
 * 
 * How it works:
 * 1. Check if ID is valid by calling TMDB API
 * 2. If invalid → Search by title to find correct ID
 * 3. Cache results to avoid repeated API calls
 * 4. Fallback to manual mapping if auto-detection fails
 * 
 * Benefits:
 * - No hardcoding needed
 * - Works for any movie automatically
 * - Self-healing system
 */

// Cache for validated IDs (in-memory + localStorage)
const ID_VALIDATION_CACHE = new Map();
const CACHE_KEY = 'tmdb_id_validation_cache';
const CACHE_VERSION = 'v1';

// Manual fallback mapping (only for edge cases)
export const YOUTUBE_TO_TMDB_MAP = {
  // Keep as fallback if auto-detection fails
  // "83533": 933260, // Commented - will use auto-detection
};

/**
 * Load ID validation cache from localStorage
 */
const loadCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return;
    
    const { version, data } = JSON.parse(cached);
    if (version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return;
    }
    
    Object.entries(data).forEach(([key, value]) => {
      ID_VALIDATION_CACHE.set(key, value);
    });
    
    console.log(`✅ [ID Cache] Loaded ${Object.keys(data).length} validated IDs`);
  } catch (error) {
    console.warn("⚠️ [ID Cache] Failed to load:", error);
  }
};

/**
 * Save ID validation cache to localStorage
 */
const saveCache = () => {
  try {
    const data = Object.fromEntries(ID_VALIDATION_CACHE);
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      version: CACHE_VERSION,
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn("⚠️ [ID Cache] Failed to save:", error);
  }
};

// Load cache on module initialization
loadCache();

/**
 * Validate if movie ID exists on TMDB
 * @param {number} id - Movie ID to validate
 * @returns {Promise<Object|null>} Movie data if valid, null if invalid
 */
const validateMovieId = async (id) => {
  try {
    const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
    const TMDB_BASE_URL = import.meta.env.VITE_TMDB_BASE_URL;
    
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&language=vi-VN`,
      { timeout: 5000 }
    );
    
    if (!response.ok) {
      console.log(`❌ [ID Validate] ID ${id} not found on TMDB (${response.status})`);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ [ID Validate] ID ${id} is valid:`, data.title);
    return data;
  } catch (error) {
    console.error(`❌ [ID Validate] Error validating ${id}:`, error.message);
    return null;
  }
};

/**
 * Search TMDB for movie by title
 * @param {string} title - Movie title to search
 * @returns {Promise<number|null>} Correct TMDB ID if found, null otherwise
 */
const searchMovieByTitle = async (title) => {
  try {
    const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
    const TMDB_BASE_URL = import.meta.env.VITE_TMDB_BASE_URL;
    
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=vi-VN&query=${encodeURIComponent(title)}`,
      { timeout: 5000 }
    );
    
    if (!response.ok) {
      console.error(`❌ [Title Search] Failed for "${title}"`);
      return null;
    }
    
    const data = await response.json();
    const results = data.results || [];
    
    if (results.length === 0) {
      console.log(`📭 [Title Search] No results for "${title}"`);
      return null;
    }
    
    // Return first result (usually most relevant)
    const movie = results[0];
    console.log(`🔍 [Title Search] Found "${title}" → ${movie.id} (${movie.title})`);
    return movie.id;
  } catch (error) {
    console.error(`❌ [Title Search] Error searching "${title}":`, error.message);
    return null;
  }
};

/**
 * Auto-normalize movie ID with validation and search
 * @param {number} id - Movie ID (potentially incorrect)
 * @param {string} title - Movie title (optional, for search fallback)
 * @returns {Promise<number>} Correct TMDB ID
 */
export const autoNormalizeMovieId = async (id, title = null) => {
  if (!id) {
    console.warn("⚠️ [Auto Normalize] No ID provided");
    return null;
  }

  const stringId = String(id);
  
  // Step 1: Check manual mapping first (fallback)
  if (YOUTUBE_TO_TMDB_MAP[stringId]) {
    const correctId = YOUTUBE_TO_TMDB_MAP[stringId];
    console.log(`🔧 [Auto Normalize] Manual map: ${id} → ${correctId}`);
    return correctId;
  }
  
  // Step 2: Check cache
  if (ID_VALIDATION_CACHE.has(stringId)) {
    const cached = ID_VALIDATION_CACHE.get(stringId);
    console.log(`💾 [Auto Normalize] Cache hit: ${id} → ${cached}`);
    return cached;
  }
  
  // Step 3: Validate ID with TMDB
  const validationResult = await validateMovieId(id);
  
  if (validationResult) {
    // ID is valid, cache and return
    ID_VALIDATION_CACHE.set(stringId, id);
    saveCache();
    return Number(id);
  }
  
  // Step 4: ID invalid, try search by title
  if (title) {
    console.log(`🔍 [Auto Normalize] ID ${id} invalid, searching by title: "${title}"`);
    const correctId = await searchMovieByTitle(title);
    
    if (correctId) {
      // Cache the mapping
      ID_VALIDATION_CACHE.set(stringId, correctId);
      saveCache();
      console.log(`✅ [Auto Normalize] Auto-fixed: ${id} → ${correctId}`);
      return correctId;
    }
  }
  
  // Step 5: All methods failed, return original ID
  console.warn(`⚠️ [Auto Normalize] Could not normalize ${id}, using original`);
  return Number(id);
};

/**
 * Synchronous normalize (uses cache only, no API calls)
 * Use this for quick operations where async is not possible
 * 
 * @param {string|number} id - Movie ID
 * @returns {number} Normalized ID (or original if not in cache)
 */
export const normalizeMovieId = (id) => {
  if (!id) {
    console.warn("⚠️ [ID Normalize] No ID provided");
    return null;
  }

  const stringId = String(id);
  
  // Check manual mapping
  if (YOUTUBE_TO_TMDB_MAP[stringId]) {
    const correctId = YOUTUBE_TO_TMDB_MAP[stringId];
    console.log(`🔧 [ID Normalize] Manual map: ${id} → ${correctId}`);
    return correctId;
  }
  
  // Check cache
  if (ID_VALIDATION_CACHE.has(stringId)) {
    const cached = ID_VALIDATION_CACHE.get(stringId);
    console.log(`💾 [ID Normalize] Cache hit: ${id} → ${cached}`);
    return cached;
  }
  
  // Return original (will be validated async later)
  return Number(id);
};

/**
 * Normalize movie object with auto-validation
 * @param {Object} movie - Movie object with id and title
 * @returns {Promise<Object>} Movie object with normalized ID
 */
export const autoNormalizeMovieObject = async (movie) => {
  if (!movie) return null;
  
  const normalizedId = await autoNormalizeMovieId(movie.id, movie.title || movie.name);
  
  if (!normalizedId) {
    console.error("❌ [Auto Normalize] Cannot normalize movie:", movie);
    return movie;
  }
  
  return {
    ...movie,
    id: normalizedId,
    ...(movie.movieId && { movieId: normalizedId })
  };
};

/**
 * Sync version of normalizeMovieObject (uses cache only)
 */
export const normalizeMovieObject = (movie) => {
  if (!movie) return null;
  
  const normalizedId = normalizeMovieId(movie.id);
  
  if (!normalizedId) {
    console.error("❌ [ID Normalize] Cannot normalize movie:", movie);
    return movie;
  }
  
  return {
    ...movie,
    id: normalizedId,
    ...(movie.movieId && { movieId: normalizedId })
  };
};

/**
 * Validate if ID exists in TMDB (legacy - use autoNormalizeMovieId instead)
 * @param {number} id - TMDB ID to validate
 * @returns {Promise<boolean>} Whether ID exists in TMDB
 */
export const isValidTMDBId = async (id) => {
  const result = await validateMovieId(id);
  return result !== null;
};

/**
 * Clear ID validation cache
 */
export const clearIdCache = () => {
  ID_VALIDATION_CACHE.clear();
  localStorage.removeItem(CACHE_KEY);
  console.log("🗑️ [ID Cache] Cleared");
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    size: ID_VALIDATION_CACHE.size,
    entries: Array.from(ID_VALIDATION_CACHE.entries())
  };
};

// Auto-enable logging in development
if (import.meta.env.DEV) {
  console.log("🔍 [Auto Normalize] System ready");
  console.log("📋 [Auto Normalize] Cache size:", ID_VALIDATION_CACHE.size);
  
  // Expose utilities to window
  window.autoNormalizeMovieId = autoNormalizeMovieId;
  window.clearIdCache = clearIdCache;
  window.getCacheStats = getCacheStats;
}

export default {
  normalizeMovieId,
  normalizeMovieObject,
  autoNormalizeMovieId,
  autoNormalizeMovieObject,
  isValidTMDBId,
  clearIdCache,
  getCacheStats,
  YOUTUBE_TO_TMDB_MAP,
};

