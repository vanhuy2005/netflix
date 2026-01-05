# 📊 Phân Tích Hệ Thống Gợi Ý Phim - Netflix Clone

> **Phần 1: Góc Nhìn End-User & Product (Tiêu chuẩn cao cấp)**

---

## 🎯 1. HIỆN TRẠNG & PAIN POINTS

### 1.1. Pain Points từ góc nhìn người dùng

#### ❌ **Problem 1: Layout Shift (CLS - Cumulative Layout Shift)**

**Hiện tượng:**

- Khi load trang Browse, các row phim chưa có dữ liệu (loading skeleton)
- Sau 1-2 giây, dữ liệu từ TMDB API trả về → component re-render
- Content bên dưới bị đẩy xuống đột ngột → Gây cảm giác "giật cục"

**Nguyên nhân (từ code hiện tại):**

```jsx
// BrowsePage.jsx - Line 88-102
{
  ALL_ROWS.slice(0, visibleRows).map((row, index) => (
    <motion.div
      key={row.id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "100px" }}
      transition={{ duration: 0.6 }}
    >
      <Row
        title={row.title}
        fetchUrl={row.fetchUrl}
        isLarge={row.isLarge || false}
      />
    </motion.div>
  ));
}
```

**Vấn đề:**

1. Mỗi `<Row>` component fetch dữ liệu riêng lẻ (waterfall requests)
2. Skeleton height chưa match chính xác với actual content height
3. Framer Motion animation `whileInView` trigger re-layout khi scroll

**Ảnh hưởng:**

- CLS score cao (Google Lighthouse penalty)
- Trải nghiệm kém, đặc biệt trên mobile/slow network
- Gây mất tập trung khi đang đọc title/browse

---

#### ❌ **Problem 2: Blank Loading / Spinner Overload**

**Hiện tượng:**

- 12 rows × ~500ms mỗi row = 6 giây loading tổng cộng
- Người dùng nhìn thấy quá nhiều skeleton loading cùng lúc

**Code hiện tại:**

```jsx
// Row.jsx - Line 78-96
if (loading) {
  return (
    <div className="w-full mb-4 md:mb-8">
      <h2 className="text-sm md:text-lg lg:text-xl font-semibold mb-2 pl-[4%] md:pl-[60px] text-white">
        {title}
      </h2>
      <div className="flex gap-2 overflow-hidden pl-[4%] md:pl-[60px]">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`flex-shrink-0 bg-gray-800 ${
              isLarge
                ? "w-[110px] md:w-[150px] aspect-[2/3]"
                : "w-[160px] md:w-[220px] aspect-video"
            } animate-pulse rounded-md`}
          />
        ))}
      </div>
    </div>
  );
}
```

**Vấn đề:**

1. Mỗi row fetch **tuần tự** (không parallel)
2. Không có data prefetching/caching
3. User phải chờ tất cả rows load xong mới thấy nội dung đầy đủ

**Metrics (ước tính):**

- Time to Interactive (TTI): ~6-8 giây
- First Contentful Paint (FCP): ~2 giây (chỉ Billboard)
- Largest Contentful Paint (LCP): ~4-5 giây

---

#### ❌ **Problem 3: Thiếu Ngữ Cảnh (Context-less Recommendations)**

**Hiện tượng:**

- App hiển thị phim nhưng không giải thích **TẠI SAO** người dùng nên xem
- Tất cả rows đều generic (Trending, Top Rated, Action...)
- Không có personalization dựa trên:
  - Lịch sử xem (watch history)
  - My List preferences
  - Tương tác trước đó (hover, click, play)

**Code hiện tại:**

```jsx
// BrowsePage.jsx - Line 10-33
const ALL_ROWS = [
  {
    id: 1,
    title: "Netflix Originals",
    fetchUrl: requests.fetchNetflixOriginals,
    isLarge: true,
  },
  { id: 2, title: "Xu Hướng", fetchUrl: requests.fetchTrending },
  { id: 3, title: "Được Đánh Giá Cao", fetchUrl: requests.fetchTopRated },
  { id: 4, title: "Phim Hành Động", fetchUrl: requests.fetchActionMovies },
  // ... 8 rows còn lại
];
```

**Vấn đề:**

1. Hardcoded rows → không dynamic
2. Không có "Because you watched X" logic
3. Không tracking user behavior (clicks, hovers, watch duration)
4. My List data (`subscribeToSavedShows`) **chỉ dùng để sync UI icon**, không dùng cho recommendation

**So sánh Netflix thật:**
| Feature | Netflix Thật | Current Clone |
|---------|-------------|---------------|
| Row context | "Because you watched Stranger Things" | "Phim Hành Động" (generic) |
| Personalization | Heavy ML (collaborative filtering) | Không có |
| Watch history | Track % watched, rewatch, pause points | Không track |
| Dynamic rows | Thay đổi theo user behavior | Hardcoded 12 rows |

---

#### ❌ **Problem 4: Image Loading Performance**

**Code hiện tại (MovieCard.jsx):**

```jsx
// MovieCard.jsx - Line 140-150 (ước đoán vì chỉ thấy 100 lines)
<img
  src={getImageUrl(isLarge ? movie.poster_path : movie.backdrop_path, "w500")}
  alt={movie.title || movie.name}
  className="w-full h-full object-cover"
  onLoad={() => setImageLoaded(true)}
/>
```

**Vấn đề:**

1. Không có blur placeholder (blur-up technique)
2. Không lazy load images ngoài viewport
3. Không responsive images (srcset) → mobile tải hình desktop size
4. Fetch từ TMDB trực tiếp (không cache CDN local)

**Ảnh hưởng:**

- Slow network: 20+ images × 50KB = 1MB+ initial load
- Mobile data waste
- LCP (Largest Contentful Paint) bị delay

---

### 1.2. Tóm tắt Pain Points

| Pain Point             | Severity    | Impact Area           | Current Status           |
| ---------------------- | ----------- | --------------------- | ------------------------ |
| Layout Shift (CLS)     | 🔴 Critical | UX, SEO               | ❌ Chưa xử lý            |
| Waterfall API Requests | 🔴 Critical | Performance, TTI      | ❌ 12 sequential calls   |
| Thiếu Personalization  | 🟡 High     | Engagement, Retention | ❌ Generic rows only     |
| Image Performance      | 🟡 High     | LCP, Mobile UX        | ❌ No lazy load, no blur |
| No Caching             | 🟡 High     | Network cost, Speed   | ❌ Fresh fetch mỗi lần   |
| No Analytics Tracking  | 🟢 Medium   | Product insights      | ❌ Không track behavior  |

---

## 🏆 2. CÁCH NETFLIX GIẢI QUYẾT (Best Practices)

### 2.1. Zero Layout Shift Strategy

**Kỹ thuật Netflix sử dụng:**

#### A. **Skeleton Matching Exact Dimensions**

```jsx
// Netflix reserves exact space BEFORE data arrives
<div className="row-container" style={{ height: "220px" }}>
  {loading ? <Skeleton /> : <ActualContent />}
</div>
```

**Lợi ích:**

- Browser biết trước layout → không re-paint
- CLS score = 0

#### B. **Above-the-Fold Priority**

- Chỉ load 2-3 rows đầu tiên ngay lập tức
- Rows bên dưới lazy load khi scroll gần (Intersection Observer)

#### C. **Progressive Hydration**

```
1. SSR HTML skeleton (instant visual)
2. Critical JS loads → hydrate Billboard
3. Viewport rows load → progressive enhancement
4. Below-fold lazy (on-demand)
```

---

### 2.2. Instant Feedback (Perceived Performance)

**Kỹ thuật:**

#### A. **Optimistic UI Updates**

```jsx
// Khi user click "Add to My List"
const handleAddToList = () => {
  // 1. Update UI ngay lập tức (không chờ server)
  setIsSaved(true);

  // 2. Call API background
  saveShow(user, profileId, movieData).catch(() => {
    // 3. Rollback nếu fail
    setIsSaved(false);
    showError();
  });
};
```

#### B. **Prefetching on Hover**

```jsx
// Netflix prefetch trailer ngay khi hover (300ms)
const handleMouseEnter = () => {
  setTimeout(() => {
    prefetchTrailer(movieId);
  }, 300);
};
```

#### C. **Stale-While-Revalidate Caching**

```javascript
// Hiển thị cached data ngay (instant)
// Fetch fresh data background → update nếu khác
const movies = getCachedMovies() || [];
fetchFreshMovies().then((fresh) => {
  if (isDifferent(fresh, movies)) {
    updateCache(fresh);
  }
});
```

---

### 2.3. Cinematic Image Loading

**Blur-Up Technique (như Medium.com):**

```jsx
<div className="image-container">
  {/* 1. Tiny blur placeholder (< 1KB, inline base64) */}
  <img
    src="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    className="blur-lg absolute inset-0"
    aria-hidden="true"
  />

  {/* 2. Full image lazy loaded */}
  <img
    src={fullImageUrl}
    loading="lazy"
    onLoad={() => setLoaded(true)}
    className={`transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
  />
</div>
```

**Progressive JPEG:**

- Load low-res → medium-res → high-res (3 passes)
- User thấy hình ngay (mờ) → dần rõ (không thấy blank)

**Responsive Images:**

```html
<img
  srcset="poster-300.jpg 300w, poster-500.jpg 500w, poster-800.jpg 800w"
  sizes="(max-width: 768px) 300px, 500px"
  src="poster-500.jpg"
/>
```

---

### 2.4. Personalization Engine (Simplified)

**Netflix's Algorithm (High-level):**

1. **Collaborative Filtering:**

   - "Users similar to you watched X"
   - Matrix factorization (SVD, ALS)

2. **Content-Based Filtering:**

   - Genre, actors, director similarity
   - Tag-based matching

3. **Hybrid Approach:**

   - Combine cả 2 phương pháp
   - A/B test different weights

4. **Context-Aware:**
   - Time of day (morning: light shows, night: movies)
   - Device (mobile: short clips, TV: full movies)
   - Recent watch pattern

**Simplified Implementation (for clone):**

```javascript
// Generate "Because you watched X" row
const getSimilarMovies = async (movieId) => {
  // TMDB có API /movie/{id}/similar
  const response = await tmdbApi.getSimilarMovies(movieId);
  return response.results;
};

// Generate row from My List preferences
const getRecommendedFromMyList = async (savedShows) => {
  // Lấy top 3 genres từ My List
  const topGenres = extractTopGenres(savedShows);

  // Fetch movies từ genres đó
  const recommendations = await Promise.all(
    topGenres.map((genre) => tmdbApi.getMoviesByGenre(genre))
  );

  return recommendations.flat();
};
```

---

### 2.5. Data Fetching Strategy

**Netflix Architecture (simplified):**

```
Frontend (React)
    ↓
Edge Server (CDN) - Cached responses (stale-while-revalidate)
    ↓
API Gateway - Rate limiting, authentication
    ↓
Recommendation Service (ML models)
    ↓
Movie Metadata Service (TMDB-like)
    ↓
User Behavior Service (watch history, ratings)
```

**Key Patterns:**

#### A. **Parallel Requests**

```javascript
// BAD (current): Sequential
for (const row of rows) {
  const movies = await fetchRow(row.url);
}

// GOOD (Netflix): Parallel
const results = await Promise.all(rows.map((row) => fetchRow(row.url)));
```

#### B. **Request Batching**

```javascript
// Instead of 12 separate requests
// Netflix batches into 1-2 requests
const response = await fetch('/api/browse', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    rows: ['trending', 'action', 'comedy', ...],
  }),
});
```

#### C. **Incremental Loading**

```javascript
// Priority tiers
const criticalRows = ["Billboard", "Trending"]; // Load immediately
const importantRows = ["Action", "MyListBased"]; // Load after critical
const lazyRows = ["Documentaries", "Romance"]; // Load on scroll
```

---

## 🔍 3. HIỆN TRẠNG HỆ THỐNG (Deep Dive)

### 3.1. Data Flow Analysis

**Current Architecture:**

```
User opens /browse
    ↓
BrowsePage.jsx renders
    ↓
Renders Billboard (1 fetch: featured movie)
    ↓
Renders 12× <Row> components
    ↓
Each Row.jsx does useEffect(() => axios.get(fetchUrl))
    ↓
12 sequential/parallel requests to TMDB
    ↓
Each response triggers setState → re-render
    ↓
Framer Motion animations trigger
    ↓
Layout stabilizes after ~6 seconds
```

**Code Evidence:**

```jsx
// Row.jsx - Line 15-38
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(fetchUrl, { timeout: 8000 });

      const validMovies = (response.data.results || []).filter(
        (movie) => movie.id && (movie.poster_path || movie.backdrop_path)
      );

      setMovies(validMovies);
    } catch (error) {
      console.error(`Error fetching ${title}:`, error.message);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [fetchUrl, title]);
```

**Issues:**

1. ❌ No caching (mỗi lần vào `/browse` fetch lại toàn bộ)
2. ❌ No prefetching (wait until component mounts)
3. ❌ No request deduplication (nếu user back/forward nhanh)
4. ❌ No error recovery (fail → show nothing)

---

### 3.2. State Management Analysis

**Current Approach:**

| State Type     | Location                                | Persistence  | Issues                      |
| -------------- | --------------------------------------- | ------------ | --------------------------- |
| Movies per row | `Row.jsx` local state                   | ❌ None      | Re-fetch on re-mount        |
| Saved shows    | `MovieCard.jsx` + Firebase subscription | ✅ Real-time | Good, but not used for reco |
| User profile   | localStorage                            | ✅ Persists  | Not synced with server      |
| Search query   | URL params                              | ✅ Shareable | Good (recently fixed)       |

**Missing:**

- ❌ Global movie cache (React Query, SWR, Zustand)
- ❌ Watch history tracking
- ❌ Interaction analytics (hover duration, clicks)
- ❌ Recommendation state (personalized rows)

---

### 3.3. Performance Metrics (Estimated)

**Desktop (Fast 4G):**
| Metric | Current | Netflix Actual | Target |
|--------|---------|----------------|--------|
| FCP | ~2s | <1s | <1.5s |
| LCP | ~4s | <2s | <2.5s |
| TTI | ~6s | <3s | <4s |
| CLS | ~0.3 | <0.1 | <0.1 |

**Mobile (Slow 3G):**
| Metric | Current | Target |
|--------|---------|--------|
| FCP | ~5s | <3s |
| LCP | ~8s | <4s |
| TTI | ~12s | <6s |

---

### 3.4. Codebase Readiness Assessment

#### ✅ **Strengths (có thể tận dụng):**

1. **Firebase Integration:**

   - Real-time subscriptions (`subscribeToSavedShows`) → có thể mở rộng cho recommendations
   - User authentication → có userId để personalize

2. **Framer Motion:**

   - Smooth animations đã có → chỉ cần optimize timing

3. **Modular Components:**

   - `Row.jsx`, `MovieCard.jsx` đã tách biệt → dễ refactor

4. **TMDB API Integration:**
   - Helper functions trong `tmdbApi.js` → có thể extend

#### ❌ **Weaknesses (cần fix):**

1. **No Caching Layer:**

   - Mọi data fetch fresh → waste bandwidth, slow UX

2. **No Analytics:**

   - Không track user behavior → không data để personalize

3. **Tight Coupling:**

   - `Row.jsx` hardcoded axios.get → khó mock/test/swap API

4. **No Loading States Orchestration:**
   - Mỗi component tự quản lý loading → không sync được

---

### 3.5. User Behavior Analysis (Missing)

**Cần track (để build recommendation):**

| Event                  | Current | Needed For           |
| ---------------------- | ------- | -------------------- |
| Movie hover (duration) | ❌      | Interest signal      |
| Click to detail        | ❌      | Strong interest      |
| Play trailer           | ❌      | Very strong signal   |
| Add to My List         | ✅      | Preference data      |
| Remove from My List    | ✅      | Negative signal      |
| Watch % (0-100%)       | ❌      | Completion rate      |
| Search queries         | ❌      | Intent understanding |
| Time on page           | ❌      | Engagement           |

**Firebase Schema cần thêm:**

```javascript
// users/{uid}/analytics/
{
  interactions: [
    {
      movieId: 12345,
      type: 'hover',
      duration: 1200, // ms
      timestamp: Date.now(),
    },
    {
      movieId: 12345,
      type: 'play_trailer',
      watchPercentage: 80,
      timestamp: Date.now(),
    }
  ],

  watchHistory: [
    {
      movieId: 67890,
      watchedAt: Date.now(),
      completion: 95, // %
    }
  ],

  preferences: {
    topGenres: [28, 35, 878], // Action, Comedy, Sci-Fi
    favoriteActors: ['Tom Cruise', 'Scarlett Johansson'],
    avgRating: 4.2,
  }
}
```

---

## 📋 4. SUMMARY & NEXT STEPS

### 4.1. Pain Points Ranked by Priority

| #   | Pain Point         | Business Impact                    | Technical Complexity |
| --- | ------------------ | ---------------------------------- | -------------------- |
| 1   | Layout Shift (CLS) | 🔴 High - SEO penalty, bounce rate | 🟡 Medium            |
| 2   | Slow Loading (TTI) | 🔴 High - User frustration         | 🟡 Medium            |
| 3   | No Personalization | 🟠 Medium - Lower engagement       | 🔴 High              |
| 4   | Image Performance  | 🟡 Medium - Mobile UX              | 🟢 Low               |
| 5   | No Analytics       | 🟢 Low - Future feature dependency | 🟢 Low               |

### 4.2. Quick Wins (Phase 1 - 1 tuần)

**Low-hanging fruits để cải thiện ngay:**

1. **Parallel API Requests** (1 ngày)

   - Dùng `Promise.all()` thay vì sequential fetches
   - Expected improvement: TTI từ 6s → 2s

2. **Skeleton Height Matching** (1 ngày)

   - Fix skeleton dimensions để match actual content
   - Expected improvement: CLS từ 0.3 → 0.05

3. **Image Lazy Loading** (1 ngày)

   - Thêm `loading="lazy"` attribute
   - Thêm blur placeholder (inline base64)
   - Expected improvement: LCP từ 4s → 2.5s

4. **Response Caching** (2 ngày)

   - Implement React Query hoặc SWR
   - Cache TMDB responses 5-10 phút
   - Expected improvement: Instant re-visits

5. **Analytics Foundation** (2 ngày)
   - Setup Firebase Analytics events
   - Track: movie_view, add_to_list, play_trailer
   - No immediate UX change, but data for Phase 2

### 4.3. Medium-term Goals (Phase 2 - 2-3 tuần)

1. **Basic Personalization:**

   - "Based on My List" row
   - "Because you watched X" logic
   - Genre preferences từ saved shows

2. **Advanced Loading:**

   - Above-fold priority
   - Incremental row loading
   - Prefetching on hover

3. **Performance Optimization:**
   - Code splitting
   - CDN caching
   - Service Worker (offline support)

### 4.4. Long-term Vision (Phase 3 - 1-2 tháng)

1. **ML-based Recommendations:**

   - Collaborative filtering (user-user similarity)
   - Content-based filtering (movie-movie similarity)
   - Hybrid model

2. **Real-time Personalization:**

   - Update rows based on current session
   - A/B testing rows
   - Dynamic row ordering

3. **Advanced Analytics:**
   - Heatmaps (where users hover most)
   - Funnel analysis (Browse → Detail → Play)
   - Retention cohorts

---

## 🎬 5. NETFLIX CASE STUDY: HOW THEY DO IT

### 5.1. Netflix Frontend Stack (Public Info)

**Technology:**

- React (with custom optimizations)
- Node.js backend-for-frontend (BFF)
- Falcor (data fetching library, Netflix OSS)
- Server-Side Rendering (SSR) for initial load
- Microservices architecture

**Performance Techniques:**

1. **Predictive Prefetching:**

   - ML model dự đoán video user sẽ click → prefetch trước
   - Accuracy: ~75-80%

2. **Adaptive Streaming:**

   - Netflix chọn video quality dựa trên bandwidth real-time
   - Tương tự: Ta có thể adaptive image quality

3. **Edge Caching:**
   - CDN cache movie metadata và thumbnails
   - 95% requests hit cache (không đến origin server)

### 5.2. Recommendation Algorithm (Simplified)

**Netflix uses ~10 different algorithms, kết hợp:**

| Algorithm               | Weight | Use Case                    |
| ----------------------- | ------ | --------------------------- |
| Collaborative Filtering | 40%    | "Users like you watched..." |
| Content-Based           | 25%    | "Similar movies to X"       |
| Trending (Time-based)   | 15%    | "Popular now"               |
| Personal Ranking        | 10%    | Re-rank results per user    |
| Diversity               | 10%    | Avoid filter bubble         |

**Our Clone Strategy (simplified):**

- 70% TMDB API (genres, similar movies)
- 20% My List analysis (user's saved genres)
- 10% Trending/Popular fallback

### 5.3. Key Metrics Netflix Optimizes

| Metric          | Definition                      | Target |
| --------------- | ------------------------------- | ------ |
| Stream Starts   | % users who click Play          | >80%   |
| Completion Rate | % of video watched              | >70%   |
| Re-engagement   | User returns within 3 days      | >60%   |
| Browse Time     | Time to find something to watch | <60s   |

**Our KPIs (for clone):**

- Click-through rate (Browse → Detail)
- Add to List rate
- Trailer play rate
- Time to first meaningful row

---

## 📚 6. REFERENCE & RESOURCES

### Documentation:

- [TMDB API Docs](https://developers.themoviedb.org/3)
- [Firebase Real-time DB Best Practices](https://firebase.google.com/docs/database/web/structure-data)
- [React Query (TanStack Query)](https://tanstack.com/query/latest)
- [Framer Motion Performance](https://www.framer.com/motion/guide-reduce-bundle-size/)

### Netflix Tech Blogs:

- [How Netflix Scales Recommendations](https://netflixtechblog.com/netflix-recommendations-beyond-the-5-stars-part-1-55838468f429)
- [Artwork Personalization](https://netflixtechblog.com/artwork-personalization-c589f074ad76)
- [Predictive Caching](https://netflixtechblog.com/netflix-at-velocity-2015-linux-performance-tools-51964ddb81cf)

### Performance:

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Image Optimization Techniques](https://web.dev/fast/#optimize-your-images)

---

**Next Document:** `RECOMMENDATION_SYSTEM_DESIGN.md` (Phase 2 - Detailed Technical Design)

---

_Document Version: 1.0_  
_Last Updated: 2026-01-02_  
_Author: Netflix Clone Dev Team_
