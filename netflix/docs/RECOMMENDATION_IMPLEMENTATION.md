# 🎯 Recommendation System - Implementation Guide

> **Phase 1: Smart Recommendations with Caching & Performance Optimization**  
> **Status:** ✅ Complete  
> **Date:** 2026-01-02

---

## 📋 OVERVIEW

Hệ thống gợi ý phim được xây dựng theo tiêu chuẩn Netflix-grade với focus vào:

- **Zero Layout Shift (CLS = 0)** - Skeleton matching exact dimensions
- **Instant Feedback** - Stale-while-revalidate caching (0ms latency khi cache fresh)
- **Smart Algorithm** - Time decay + weighted scoring + deduplication
- **Graceful Degradation** - Silent failures, không crash UI

---

## 🏗️ ARCHITECTURE

### Data Flow

```
User plays movie
    ↓
Player.jsx tracks → addToWatchHistory(user, profileId, movie)
    ↓
Firestore: users/{uid}/profiles/{profileId}/watchHistory/{movieId}
    ↓
BrowsePage.jsx renders
    ↓
RecommendationRow → useSmartRecommendations hook
    ↓
┌─────────────────────────────────────┐
│  1. getWatchHistory (last 3 movies) │
│  2. Check localStorage cache        │
│  3. If fresh & same context → DONE  │
│  4. Else: Fetch from TMDB API       │
│  5. Weighted scoring algorithm      │
│  6. Save cache, update UI           │
└─────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTATION DETAILS

### 1. Firebase Helpers (`src/config/firebase.js`)

**New Functions:**

#### `addToWatchHistory(user, profileId, movie)`

- **Purpose:** Track user watch behavior for recommendations
- **When to call:** Player component, when video starts (onPlayerReady)
- **Debouncing:** Uses `watchTrackedRef` to prevent duplicate writes
- **Schema:**
  ```javascript
  {
    id: number,
    title: string,
    poster_path: string,
    backdrop_path: string,
    genre_ids: array,
    vote_average: number,
    last_watched: serverTimestamp()
  }
  ```

#### `getWatchHistory(user, profileId, limit = 3)`

- **Purpose:** Fetch recent watched movies for seed generation
- **Returns:** Array of watched movies, ordered by `last_watched` DESC
- **Usage:** Called by `useSmartRecommendations` hook

**Firestore Path:**

```
users/
  {uid}/
    profiles/
      {profileId}/
        watchHistory/          ← New collection
          {movieId}/
            - id
            - title
            - poster_path
            - backdrop_path
            - genre_ids
            - vote_average
            - last_watched (timestamp)
```

---

### 2. Smart Recommendations Hook (`src/hooks/useSmartRecommendations.js`)

**Core Algorithm:**

#### Step 1: Seed Selection & Time Decay

```javascript
// Get last 3 watched movies
const history = await getWatchHistory(user, profileId, 3);

// Calculate time decay factor
const now = Date.now();
const ageInHours = (now - lastWatched) / (1000 * 60 * 60);

let decayFactor;
if (ageInHours < 24) decayFactor = 1.0; // Today
else if (ageInHours < 48) decayFactor = 0.8; // Yesterday
else if (ageInHours < 72) decayFactor = 0.6; // 2 days ago
else decayFactor = 0.4; // Older

// Position weight (first = most important)
const positionWeight = 1.0 - index * 0.2;

const finalWeight = decayFactor * positionWeight;
```

**Example Weights:**
| Movie | Watched | Age (hours) | Decay | Position | Final Weight |
|-------|---------|-------------|-------|----------|--------------|
| A | Today | 2 | 1.0 | 1.0 (1st) | **1.0** |
| B | Yesterday | 30 | 0.8 | 0.8 (2nd) | **0.64** |
| C | 3 days ago | 75 | 0.4 | 0.6 (3rd) | **0.24** |

#### Step 2: Cache Strategy (Stale-While-Revalidate)

```javascript
const cacheKey = `netflix_recs_${profileId}`;
const cached = localStorage.getItem(cacheKey);

if (cached) {
  const { timestamp, seedSignature, payload } = JSON.parse(cached);
  const isFresh = Date.now() - timestamp < 15 * 60 * 1000; // 15 min
  const isSameContext = seedSignature === currentSeeds.join("-");

  if (isFresh && isSameContext) {
    return payload; // ⚡ Zero network request!
  }
}
```

**Cache Invalidation Rules:**

- **Age:** > 15 minutes → stale
- **Context change:** User watched new movie → different seedSignature → invalidate
- **Manual:** Clear cache on logout or profile switch

#### Step 3: Parallel API Execution

```javascript
// Fetch recommendations for all 3 seeds in parallel
const requests = seeds.map((seed) =>
  axios.get(`/movie/${seed.id}/recommendations`)
);

const responses = await Promise.allSettled(requests);
// ✅ Use allSettled (not all) → 1 failure won't crash all
```

**Performance:**

- Sequential (old): 3 seeds × 500ms = **1500ms**
- Parallel (new): max(500ms, 500ms, 500ms) = **500ms** ⚡

#### Step 4: Weighted Scoring System

```javascript
// For each candidate movie in the pool:
const W_freq = 10;    // Frequency weight
const W_rating = 0.5; // Rating weight
const W_decay = 5;    // Time decay weight

const score =
  (frequency × W_freq) +         // Appears in multiple lists
  (vote_average × W_rating) +    // TMDB rating (0-10)
  (seedWeight × W_decay);        // Recent seed = higher score
```

**Example Calculation:**
| Movie | Frequency | TMDB Rating | Seed Weight | Score |
|-------|-----------|-------------|-------------|-------|
| X | 3 (all seeds) | 8.5 | 1.0 | 3×10 + 8.5×0.5 + 1.0×5 = **39.25** |
| Y | 2 (seed A,B) | 7.2 | 0.8 | 2×10 + 7.2×0.5 + 0.8×5 = **27.6** |
| Z | 1 (seed A) | 9.0 | 0.4 | 1×10 + 9.0×0.5 + 0.4×5 = **16.5** |

→ Ranking: **X > Y > Z**

#### Step 5: Quality Filters

```javascript
// Reject if:
-!movie.id - // Invalid data
  seedIds.has(movie.id) - // Already watched (seed)
  !movie.backdrop_path - // No image (UI quality)
  movie.adult ===
  true - // Adult content (optional)
    movie.vote_count <
    50; // Too niche (optional)
```

#### Step 6: Contextual Title Generation

```javascript
let title;
if (seeds.length === 1) {
  title = `Because you watched ${seeds[0].title}`;
} else if (seeds.length === 2) {
  title = `Because you watched ${seeds[0].title} and ${seeds[1].title}`;
} else {
  title = `Top Picks for You`;
}
```

**Output:**

```javascript
{
  movies: [...20 top-scored movies],
  reason: "Because you watched Inception",
  loading: false
}
```

---

### 3. Skeleton Components (`src/components/common/Skeleton.jsx`)

**Why Skeleton Matters:**

- **CLS (Cumulative Layout Shift):** Browser pre-allocates space → no jump when data loads
- **Perceived Performance:** User sees structure immediately, feels faster
- **Netflix Standard:** Zero blank screens

**Implementation:**

#### RecommendationRowSkeleton

```jsx
<div className="mb-4 md:mb-8 w-full px-4 md:px-12">
  {/* Title Skeleton - matches exact height */}
  <div className="h-5 md:h-6 w-48 md:w-64 bg-gray-800 rounded animate-pulse" />

  {/* Cards Skeleton - matches MovieCard dimensions */}
  <div className="flex gap-2 overflow-hidden py-2">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="w-[160px] md:w-[220px] aspect-video bg-gray-800 rounded-md"
      >
        {/* Shimmer effect */}
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      </div>
    ))}
  </div>
</div>
```

**Key Features:**

- ✅ **Exact dimensions** match real MovieCard (w-[160px], aspect-video)
- ✅ **Shimmer animation** (gradient sweep) for Netflix feel
- ✅ **Stagger delay** (i × 0.15s) for cascading effect

---

### 4. Recommendation Row Component (`src/components/Browse/RecommendationRow.jsx`)

**Features:**

#### A. Smart Loading States

```jsx
if (loading) return <RecommendationRowSkeleton />;
if (movies.length === 0) return null; // Graceful hide
```

#### B. Contextual Title with Animation

```jsx
<motion.div
  initial={{ scale: 0, rotate: -180 }}
  animate={{ scale: 1, rotate: 0 }}
>
  <IoSparkles className="text-yellow-500" /> {/* Sparkle icon */}
</motion.div>

<h2>{reason || 'Recommended for You'}</h2>
```

#### C. Smooth Scroll Navigation

```jsx
const handleScroll = (direction) => {
  const scrollAmount = clientWidth;
  rowRef.current.scrollTo({
    left:
      direction === "left"
        ? scrollLeft - scrollAmount
        : scrollLeft + scrollAmount,
    behavior: "smooth",
  });
};
```

#### D. Arrow Visibility Logic

```jsx
// Show left arrow only if scrolled
setShowLeftArrow(scrollLeft > 0);

// Show right arrow only if more content exists
setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
```

#### E. Staggered Card Animation

```jsx
{
  movies.map((movie, index) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }} // Cascading effect
    >
      <MovieCard movie={movie} />
    </motion.div>
  ));
}
```

---

### 5. Integration Points

#### BrowsePage.jsx

```jsx
import RecommendationRow from "../../components/Browse/RecommendationRow";

// Get current user & profile
const [user, setUser] = useState(null);
const [profileId, setProfileId] = useState(null);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    if (currentUser) {
      const profile = JSON.parse(localStorage.getItem("current_profile"));
      setProfileId(profile.id);
    }
  });
  return () => unsubscribe();
}, []);

// Render at priority position (before generic rows)
<RecommendationRow user={user} profileId={profileId} />;
```

#### Player.jsx

```jsx
import { addToWatchHistory } from "../../config/firebase";

const onPlayerReady = (event) => {
  playerRef.current = event.target;

  // Track watch history (once per session)
  if (user && movieInfo && !watchTrackedRef.current) {
    const profile = JSON.parse(localStorage.getItem("current_profile"));
    addToWatchHistory(user, profile.id, movieInfo);
    watchTrackedRef.current = true;
  }
};
```

---

## 📊 PERFORMANCE METRICS

### Before Implementation

| Metric                   | Value            |
| ------------------------ | ---------------- |
| Recommendation Load Time | N/A (no feature) |
| Generic Rows Only        | 12 static rows   |
| Personalization          | 0%               |

### After Implementation (Estimated)

| Metric                       | Cache Hit  | Cache Miss   |
| ---------------------------- | ---------- | ------------ |
| **Recommendation Load Time** | **0ms** ⚡ | ~500ms       |
| **Network Requests**         | 0          | 3 (parallel) |
| **CLS Score**                | 0.0        | 0.0          |
| **User Engagement**          | +30%\*     | +30%\*       |

\*Estimated based on Netflix's published stats (personalization increases watch time by 25-35%)

---

## 🧪 TESTING CHECKLIST

### Manual Testing Steps

1. **Fresh User (No Watch History)**

   - ✅ RecommendationRow should NOT render (graceful hide)
   - ✅ No errors in console
   - ✅ Generic rows render normally

2. **Watch 1 Movie**

   - ✅ Navigate to Player, wait for video to start
   - ✅ Check Firestore: `watchHistory/{movieId}` created
   - ✅ Go back to Browse → See "Because you watched X" row
   - ✅ Verify 20 recommendations loaded

3. **Watch 2-3 Movies**

   - ✅ Title changes to "Because you watched X and Y" or "Top Picks for You"
   - ✅ Different movies in recommendations
   - ✅ Higher scores for movies appearing in multiple seeds

4. **Cache Behavior**

   - ✅ First load: API calls (check Network tab)
   - ✅ Refresh page immediately: 0 network requests (cache hit)
   - ✅ After 15 minutes: New API calls (cache stale)
   - ✅ Watch new movie: Cache invalidated, fresh recommendations

5. **Edge Cases**

   - ✅ All 3 API requests fail → Row hides gracefully
   - ✅ 1/3 requests fail → Still shows recommendations from successful seeds
   - ✅ No backdrop_path → Movie filtered out (UI quality)
   - ✅ Profile switch → Cache cleared, fresh fetch

6. **Visual Regression**
   - ✅ Skeleton matches exact MovieCard dimensions (no layout shift)
   - ✅ Shimmer animation smooth (60fps)
   - ✅ Sparkle icon animates on mount
   - ✅ Scroll arrows appear/disappear correctly

### Console Logs (Development)

Enable verbose logging:

```javascript
// useSmartRecommendations.js
console.log("🎬 [Recs] Fetching watch history...");
console.log("💾 [Recs] Cache check:", { age, isFresh, isSameContext });
console.log("🧮 [Recs] Calculating scores...");
console.log("✅ [Recs] Recommendation engine completed successfully");
```

**Expected Output (Cache Hit):**

```
🎬 [Recs] Fetching watch history...
📚 [Recs] Found 3 seed movies: ['Inception', 'Interstellar', 'The Prestige']
💾 [Recs] Cache check: { age: '120s', isFresh: true, isSameContext: true }
✅ [Recs] Using fresh cache - ZERO network requests
```

**Expected Output (Cache Miss):**

```
🎬 [Recs] Fetching watch history...
📚 [Recs] Found 3 seed movies: [...]
💾 [Recs] Cache check: { age: '950s', isFresh: false, isSameContext: true }
🔄 [Recs] Cache stale/outdated - will revalidate
⏰ [Recs] Seed Inception: { ageInHours: 2, decayFactor: 1.0, finalWeight: 1.0 }
🌐 [Recs] Fetching recommendations from TMDB...
📦 [Recs] API responses: 3/3 succeeded
🧮 [Recs] Calculating scores...
🎯 [Recs] Pool size before filtering: 45
✨ [Recs] Final recommendations: 20 movies
🏆 [Recs] Top 3: [{ title: 'Shutter Island', score: 39, ... }]
💾 [Recs] Cache updated
✅ [Recs] Recommendation engine completed successfully
```

---

## 🔍 DEBUGGING GUIDE

### Issue: "No recommendations showing"

**Check:**

1. Does user have watch history?

   ```javascript
   // Firestore Console
   users / { uid } / profiles / { profileId } / watchHistory;
   // Should have ≥1 document
   ```

2. Is user authenticated?

   ```javascript
   console.log("User:", user); // Should not be null
   console.log("ProfileId:", profileId); // Should be valid ID
   ```

3. Are API requests succeeding?

   ```javascript
   // Network tab → Filter "recommendations"
   // Should see 3 requests with 200 status
   ```

4. Is cache blocking fresh data?
   ```javascript
   localStorage.removeItem("netflix_recs_" + profileId);
   // Refresh page
   ```

### Issue: "Layout shift when recommendations load"

**Fix:**

- Ensure `RecommendationRowSkeleton` has exact same dimensions as `RecommendationRow`
- Check CSS classes match:

  ```jsx
  // Skeleton
  className = "w-[160px] md:w-[220px] aspect-video";

  // Actual (in MovieCard)
  className = "w-[160px] md:w-[220px] aspect-video";
  ```

### Issue: "Recommendations not updating after watching new movie"

**Check:**

1. `watchTrackedRef` is resetting properly
2. Cache invalidation logic:

   ```javascript
   // New seedSignature should differ
   const oldSig = "123-456-789";
   const newSig = "123-456-999"; // Last movie changed
   ```

3. Firestore write succeeded:
   ```javascript
   // Console should show:
   "💾 Saving to Firestore: { id: 999, title: '...', ... }";
   "✅ Watch history updated";
   ```

---

## 📈 FUTURE ENHANCEMENTS

### Phase 2: Advanced Personalization (2-3 weeks)

1. **"Continue Watching" Row**

   - Track watch percentage (YouTube onStateChange)
   - Show movies with < 95% completion
   - Resume from last position

2. **Genre Preferences**

   - Analyze genre_ids from watch history
   - Weight recommendations by favorite genres
   - "More Like This" per genre

3. **Collaborative Filtering**

   - If multiple users: find similar users
   - Recommend movies they watched
   - Requires user-user similarity matrix

4. **Time-based Context**
   - Morning (6-12): Light content, news
   - Evening (18-22): Movies, dramas
   - Night (22-24): Thrillers, action

### Phase 3: ML Integration (1-2 months)

1. **Hybrid Model**

   - Content-based (current implementation)
   - Collaborative filtering (user-user similarity)
   - Matrix factorization (SVD)
   - Weighted ensemble

2. **A/B Testing**

   - Test different scoring weights
   - Measure click-through rate (CTR)
   - Optimize for watch completion

3. **Real-time Adaptation**
   - Update recommendations mid-session
   - React to hover duration, clicks
   - Predictive prefetching

---

## 🎓 LEARNING RESOURCES

### Algorithms

- [Netflix Recommendation System (Tech Blog)](https://netflixtechblog.com/netflix-recommendations-beyond-the-5-stars-part-1-55838468f429)
- [Collaborative Filtering Explained](https://developers.google.com/machine-learning/recommendation/collaborative/basics)

### Performance

- [Stale-While-Revalidate Pattern](https://web.dev/stale-while-revalidate/)
- [Cumulative Layout Shift (CLS)](https://web.dev/cls/)
- [Skeleton Screens Best Practices](https://uxdesign.cc/what-you-should-know-about-skeleton-screens-a820c45a571a)

### Implementation

- [React Query (TanStack Query)](https://tanstack.com/query/latest/docs/react/overview) - Alternative to manual caching
- [Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mon)

---

## 📝 CHANGELOG

### v1.0.0 (2026-01-02)

- ✅ Initial implementation
- ✅ Firebase watch history tracking
- ✅ Smart recommendations hook with caching
- ✅ Skeleton loading components
- ✅ RecommendationRow UI component
- ✅ Integration with BrowsePage & Player
- ✅ Comprehensive documentation

---

**Next Steps:** Test with real users, gather metrics, iterate on scoring weights based on engagement data.

---

_Document Author: Netflix Clone Dev Team_  
_Last Updated: 2026-01-02_  
_Version: 1.0.0_
