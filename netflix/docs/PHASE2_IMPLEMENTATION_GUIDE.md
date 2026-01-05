# 🚀 GIAI ĐOẠN 2: MIGRATION SANG CLOUD FUNCTIONS

## 📋 Tổng quan

Chuyển logic recommendation từ Client (React) sang Server (Firebase Cloud Functions) để:
- 🔒 Bảo mật API Key
- ⚡ Caching hiệu quả hơn (Firestore thay vì localStorage)
- 📈 Scale tốt hơn cho production

---

## ⚠️ LƯU Ý QUAN TRỌNG VỀ BILLING

**Firebase Cloud Functions yêu cầu Blaze Plan (Pay-as-you-go)**

- ✅ Miễn phí: 2 triệu invocations/tháng
- ✅ Miễn phí: 400,000 GB-seconds
- ✅ Miễn phí: 200,000 CPU-seconds
- ⚠️ Cần: Thẻ VISA/Mastercard để kích hoạt

**Chi phí thực tế cho dự án nhỏ:** $0/tháng (nằm trong free tier)

**Quyết định:**
- [ ] Tôi đã sẵn sàng enable Blaze Plan
- [ ] Tôi muốn skip Phase 2 (giữ nguyên Phase 1)

---

## 📅 Roadmap Phase 2

```
┌─────────────────────────────────────────────────────┐
│  STEP 1: Setup Firebase Functions (15-20 phút)     │
├─────────────────────────────────────────────────────┤
│  STEP 2: Write Cloud Function (30-45 phút)         │
├─────────────────────────────────────────────────────┤
│  STEP 3: Deploy & Test (10-15 phút)                │
├─────────────────────────────────────────────────────┤
│  STEP 4: Refactor Client (20-30 phút)              │
├─────────────────────────────────────────────────────┤
│  STEP 5: Cleanup & Security (10 phút)              │
└─────────────────────────────────────────────────────┘
Total: ~2 hours
```

---

## 🛠️ STEP 1: Setup Firebase Cloud Functions

### 1.1. Cài đặt Firebase CLI (Nếu chưa có)

```bash
# Check xem đã có chưa
firebase --version

# Nếu chưa có, cài đặt
npm install -g firebase-tools
```

### 1.2. Login Firebase

```bash
firebase login
```

Browser sẽ mở → Chọn Google account → Allow permissions.

### 1.3. Khởi tạo Functions

**Tại thư mục gốc dự án:**

```bash
cd C:\Users\Admin\Desktop\netflix\netflix
firebase init functions
```

**Trả lời các câu hỏi:**

```
? Select a default Firebase project for this directory:
  → Chọn project Netflix của bạn (ví dụ: netflix-clone-abc123)

? What language would you like to use to write Cloud Functions?
  → JavaScript (hoặc TypeScript nếu bạn thạo)

? Do you want to use ESLint to catch probable bugs and enforce style?
  → No (để đơn giản)

? Do you want to install dependencies with npm now?
  → Yes
```

**Kết quả:** Sẽ tạo thư mục `functions/` với cấu trúc:

```
functions/
├── index.js           ← Code functions ở đây
├── package.json
├── .gitignore
└── node_modules/
```

### 1.4. Cài đặt Dependencies cho Backend

```bash
cd functions
npm install axios firebase-admin
cd ..
```

### 1.5. Enable Blaze Plan

1. Mở Firebase Console: https://console.firebase.google.com
2. Chọn project Netflix
3. Settings (⚙️) → Usage and billing → Details & settings
4. Click **"Upgrade"** → Chọn Blaze Plan
5. Thêm thẻ thanh toán (required)
6. Set budget alert: $5/month (để an tâm)

---

## 🔧 STEP 2: Write Cloud Function

### 2.1. Cấu hình Environment Variables

**Lưu TMDB API Key vào Firebase Config (Bảo mật):**

```bash
firebase functions:config:set tmdb.key="YOUR_TMDB_API_KEY_HERE"
firebase functions:config:set tmdb.base_url="https://api.themoviedb.org/3"
```

**Lấy API Key từ .env hiện tại:**
```bash
# Copy từ file .env.local
# VITE_TMDB_API_KEY=eyJhbGciOiJIUz...
```

**Verify config:**
```bash
firebase functions:config:get
```

### 2.2. Viết Function Code

Mở file `functions/index.js` và thay thế toàn bộ nội dung:

```javascript
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Get config từ environment
const TMDB_KEY = functions.config().tmdb.key;
const TMDB_URL = functions.config().tmdb.base_url;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get time context for genre boosting
 * @returns {string} 'morning' | 'afternoon' | 'evening'
 */
const getTimeContext = () => {
  const hour = new Date().getHours() + 7; // UTC+7 for Vietnam
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
};

/**
 * Genre boost mapping by time of day
 */
const TIME_GENRE_BOOST = {
  morning: [16, 10751, 99], // Animation, Family, Documentary
  afternoon: [28, 12, 35],  // Action, Adventure, Comedy
  evening: [27, 53, 18],    // Horror, Thriller, Drama
};

// ==========================================
// MAIN CLOUD FUNCTION: getSmartRecommendations
// ==========================================

/**
 * Smart Recommendations Engine (Server-side)
 * 
 * Flow:
 * 1. Validate user authentication
 * 2. Check Firestore cache (4 hours TTL)
 * 3. If cache stale → Calculate recommendations
 * 4. Save cache → Return results
 * 
 * @param {Object} data - { profileId: string }
 * @param {Object} context - Authentication context
 * @returns {Object} { movies: Array, reason: string }
 */
exports.getSmartRecommendations = functions
  .region('asia-southeast1') // Chọn region gần VN (Singapore)
  .https.onCall(async (data, context) => {
    const startTime = Date.now();

    try {
      // ========================================
      // STEP 1: Authentication & Validation
      // ========================================
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'User must be logged in to get recommendations.'
        );
      }

      const userId = context.auth.uid;
      const { profileId } = data;

      if (!profileId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'profileId is required.'
        );
      }

      console.log(`🎬 [Cloud] Recommendation request: User=${userId}, Profile=${profileId}`);

      // ========================================
      // STEP 2: Check Firestore Cache
      // ========================================
      const cacheRef = db.doc(`users/${userId}/profiles/${profileId}/recs/feed`);
      const cacheSnap = await cacheRef.get();

      const CACHE_DURATION = 1000 * 60 * 60 * 4; // 4 hours

      if (cacheSnap.exists) {
        const cacheData = cacheSnap.data();
        const age = Date.now() - cacheData.timestamp.toMillis();

        if (age < CACHE_DURATION) {
          const elapsed = Date.now() - startTime;
          console.log(`✅ [Cloud] Serving from cache (${elapsed}ms, 1 read)`);
          return cacheData.payload;
        } else {
          console.log(`🔄 [Cloud] Cache stale (${Math.round(age / 1000 / 60)}min old)`);
        }
      } else {
        console.log(`💾 [Cloud] No cache found - will calculate`);
      }

      // ========================================
      // STEP 3: Fetch User Data (Profile + History)
      // ========================================
      
      // 3.1. Get Profile (for savedMovieIds)
      const profileRef = db.doc(`users/${userId}/profiles/${profileId}`);
      const profileSnap = await profileRef.get();

      if (!profileSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Profile not found.');
      }

      const profileData = profileSnap.data();
      const savedIds = new Set(profileData.savedMovieIds || []);

      console.log(`📋 [Cloud] Profile "${profileData.name}": ${savedIds.size} saved movies`);

      // 3.2. Get Watch History (Seeds)
      const historyRef = db.collection(`users/${userId}/profiles/${profileId}/watchHistory`);
      const historySnap = await historyRef
        .orderBy('last_watched', 'desc')
        .limit(3)
        .get();

      if (historySnap.empty) {
        console.log(`📭 [Cloud] No watch history - returning empty`);
        return {
          movies: [],
          reason: 'Hãy xem vài phim để nhận gợi ý nhé!',
        };
      }

      const seeds = historySnap.docs.map(doc => doc.data());
      const seedIds = new Set(seeds.map(s => s.id));

      console.log(`📚 [Cloud] Found ${seeds.length} seed movies:`, seeds.map(s => s.title));

      // ========================================
      // STEP 4: Calculate Time Decay Weights
      // ========================================
      const now = Date.now();
      const seedsWithDecay = seeds.map((seed, index) => {
        const lastWatched = seed.last_watched?.toMillis?.() || now;
        const ageInHours = (now - lastWatched) / (1000 * 60 * 60);

        let decayFactor;
        if (ageInHours < 24) decayFactor = 1.0;
        else if (ageInHours < 48) decayFactor = 0.8;
        else if (ageInHours < 72) decayFactor = 0.6;
        else decayFactor = 0.4;

        const positionWeight = 1.0 - index * 0.2;
        const finalWeight = decayFactor * positionWeight;

        return { ...seed, weight: finalWeight };
      });

      // ========================================
      // STEP 5: Fetch TMDB Recommendations (Parallel)
      // ========================================
      console.log(`🌐 [Cloud] Fetching from TMDB API...`);

      const requests = seedsWithDecay.map(seed =>
        axios.get(`${TMDB_URL}/movie/${seed.id}/recommendations`, {
          params: { api_key: TMDB_KEY, language: 'vi-VN' },
          timeout: 8000,
        })
        .then(res => ({ seed, results: res.data.results || [], status: 'success' }))
        .catch(err => {
          console.warn(`⚠️ [Cloud] TMDB failed for ${seed.title}:`, err.message);
          return { seed, results: [], status: 'failed' };
        })
      );

      const responses = await Promise.allSettled(requests);
      const successfulResponses = responses
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)
        .filter(r => r.status === 'success');

      if (successfulResponses.length === 0) {
        throw new functions.https.HttpsError(
          'unavailable',
          'Unable to fetch recommendations from TMDB.'
        );
      }

      console.log(`📦 [Cloud] ${successfulResponses.length}/${requests.length} TMDB requests succeeded`);

      // ========================================
      // STEP 6: Scoring Algorithm
      // ========================================
      console.log(`🧮 [Cloud] Calculating scores...`);

      const moviePool = {};
      const timeContext = getTimeContext();
      const boostedGenres = TIME_GENRE_BOOST[timeContext];

      successfulResponses.forEach(({ seed, results }) => {
        const seedWeight = seed.weight;

        results.forEach(movie => {
          // Quality gates
          if (!movie.id) return;
          if (seedIds.has(movie.id)) return;
          if (savedIds.has(movie.id)) return;
          if (!movie.backdrop_path) return;

          // Initialize
          if (!moviePool[movie.id]) {
            moviePool[movie.id] = { ...movie, score: 0, frequency: 0 };
          }

          // Scoring
          const W_freq = 10;
          const W_rating = 0.5;
          const W_decay = 5;
          const W_genre = 2;

          const frequencyScore = 1 * W_freq;
          const ratingScore = (movie.vote_average || 0) * W_rating;
          const decayScore = seedWeight * W_decay;

          let genreScore = 0;
          const hasBoostedGenre = movie.genre_ids?.some(id => boostedGenres.includes(id));
          if (hasBoostedGenre) genreScore = W_genre;

          moviePool[movie.id].score += frequencyScore + ratingScore + decayScore + genreScore;
          moviePool[movie.id].frequency += 1;
        });
      });

      // ========================================
      // STEP 7: Finalize Results
      // ========================================
      const finalMovies = Object.values(moviePool)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

      let reason = 'Gợi ý hàng đầu cho bạn';
      if (timeContext === 'evening') reason = 'Phim hay cho buổi tối';
      else if (seeds.length === 1) reason = `Vì bạn đã xem ${seeds[0].title}`;

      const payload = { movies: finalMovies, reason };

      console.log(`✨ [Cloud] Final: ${finalMovies.length} movies`);

      // ========================================
      // STEP 8: Save Cache to Firestore
      // ========================================
      await cacheRef.set({
        payload: payload,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        seedSignature: seeds.map(s => s.id).join('-'),
      });

      const elapsed = Date.now() - startTime;
      console.log(`✅ [Cloud] Completed in ${elapsed}ms (1 write)`);

      return payload;

    } catch (error) {
      console.error(`❌ [Cloud] Error:`, error);
      
      if (error instanceof functions.https.HttpsError) {
        throw error; // Re-throw Firebase errors
      }
      
      throw new functions.https.HttpsError('internal', error.message);
    }
  });
```

### 2.3. Update package.json (Functions)

Mở `functions/package.json`, verify engines:

```json
{
  "engines": {
    "node": "18"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.5.0"
  }
}
```

---

## 🚀 STEP 3: Deploy & Test Function

### 3.1. Deploy lên Firebase

```bash
# Tại thư mục gốc
firebase deploy --only functions
```

**Output mong đợi:**

```
✔  functions: Finished running predeploy script.
i  functions: preparing codebase default for deployment
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
i  functions: ensuring required API cloudbuild.googleapis.com is enabled...
✔  functions: required API cloudfunctions.googleapis.com is enabled
✔  functions: required API cloudbuild.googleapis.com is enabled
i  functions: uploading functions...
✔  functions[getSmartRecommendations(asia-southeast1)]: Successful create operation
✔  Deploy complete!

Function URL: https://asia-southeast1-your-project.cloudfunctions.net/getSmartRecommendations
```

**Thời gian:** ~2-3 phút lần đầu.

### 3.2. Test Function qua Firebase Console

1. Firebase Console → Functions tab
2. Click `getSmartRecommendations`
3. Logs tab → Xem real-time logs
4. Dashboard → Metrics (Invocations, Errors, Duration)

### 3.3. Test Function qua Client (Tạm)

Tạo file test tạm `functions/test-local.js`:

```javascript
const { httpsCallable } = require('firebase/functions');
const { getFunctions } = require('firebase/functions');
const { initializeApp } = require('firebase/app');

// Copy config từ firebase.js
const firebaseConfig = { /* ... */ };

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'asia-southeast1');

const getSmartRecommendations = httpsCallable(functions, 'getSmartRecommendations');

async function test() {
  try {
    const result = await getSmartRecommendations({ profileId: 'YOUR_PROFILE_ID' });
    console.log('Success:', result.data);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
```

---

## 🔨 STEP 4: Refactor Client

### 4.1. Update useSmartRecommendations Hook

**BACKUP FILE CŨ TRƯỚC:**

```bash
cp src/hooks/useSmartRecommendations.js src/hooks/useSmartRecommendations.backup.js
```

**Thay thế toàn bộ logic:**

File: `src/hooks/useSmartRecommendations.js`

```javascript
import { useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../config/firebase";

const CACHE_KEY_PREFIX = "netflix_recs_";
const CACHE_DURATION = 1000 * 60 * 60 * 3; // 3 hours (client-side stale check)

/**
 * Smart Recommendations Hook (PHASE 2: Cloud Function Edition)
 * 
 * Changes from Phase 1:
 * - Removed all TMDB API logic
 * - Removed scoring algorithm
 * - Now simply calls Cloud Function
 * - Keeps client-side cache for instant UX
 * 
 * @param {Object} user - Firebase Auth user
 * @param {string} profileId - Current profile ID
 * @param {boolean} isEnabled - Lazy loading control
 * @returns {Object} { movies: Array, reason: string, loading: boolean }
 */
export const useSmartRecommendations = (user, profileId, isEnabled = true) => {
  const [data, setData] = useState({
    movies: [],
    reason: "",
    loading: false,
  });

  useEffect(() => {
    if (!user || !profileId) {
      setData({ movies: [], reason: "", loading: false });
      return;
    }

    if (!isEnabled) {
      console.log("⏸️ [Recs] Hook disabled - waiting for trigger");
      return;
    }

    setData(prev => ({ ...prev, loading: true }));

    const fetchRecommendations = async () => {
      try {
        // ========================================
        // STEP 1: Check Client-side Cache (Instant UX)
        // ========================================
        const cacheKey = `${CACHE_KEY_PREFIX}${profileId}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            const age = Date.now() - parsed.timestamp;

            if (age < CACHE_DURATION) {
              console.log("✅ [Recs] Using client cache - instant display");
              setData({ ...parsed.payload, loading: false });
              return;
            } else {
              console.log("🔄 [Recs] Client cache stale - fetching from server");
              // Show stale data while fetching fresh
              setData({ ...parsed.payload, loading: true });
            }
          } catch (e) {
            console.warn("⚠️ [Recs] Cache parse error:", e);
            localStorage.removeItem(cacheKey);
          }
        }

        // ========================================
        // STEP 2: Call Cloud Function
        // ========================================
        console.log("🌐 [Recs] Calling Cloud Function...");
        
        const functions = getFunctions(app, 'asia-southeast1');
        const getRecommendationsFunc = httpsCallable(functions, 'getSmartRecommendations');

        const result = await getRecommendationsFunc({ profileId });

        console.log(`✅ [Recs] Received ${result.data.movies.length} movies from server`);

        // ========================================
        // STEP 3: Update Client Cache
        // ========================================
        const payload = result.data;

        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            timestamp: Date.now(),
            payload,
          }));
          console.log("💾 [Recs] Client cache updated");
        } catch (e) {
          console.warn("⚠️ [Recs] Failed to save cache:", e);
        }

        // ========================================
        // STEP 4: Update UI
        // ========================================
        setData({ ...payload, loading: false });

      } catch (error) {
        console.error("❌ [Recs] Error:", error);
        
        // User-friendly error messages
        let errorMessage = "Không thể tải gợi ý phim";
        
        if (error.code === 'unauthenticated') {
          errorMessage = "Vui lòng đăng nhập";
        } else if (error.code === 'unavailable') {
          errorMessage = "Dịch vụ tạm thời không khả dụng";
        }

        setData({ 
          movies: [], 
          reason: errorMessage, 
          loading: false 
        });
      }
    };

    fetchRecommendations();
  }, [user, profileId, isEnabled]);

  return data;
};
```

### 4.2. Verify firebase.js config

Đảm bảo file `src/config/firebase.js` có export `app`:

```javascript
import { initializeApp } from "firebase/app";

const firebaseConfig = { /* ... */ };

export const app = initializeApp(firebaseConfig); // ← Must export
export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

## 🔒 STEP 5: Security & Cleanup

### 5.1. Remove TMDB API Key từ Client

**File: `.env.local`**

```bash
# VITE_TMDB_API_KEY=... ← Comment out hoặc xóa
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
```

### 5.2. Update .gitignore

```bash
# .gitignore
.env
.env.local
functions/.env
functions/config.json
```

### 5.3. Firestore Security Rules

Cập nhật rules để bảo vệ cache:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/profiles/{profileId}/recs/{doc} {
      // Only allow read - writes come from Cloud Function
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Prevent client writes
    }
  }
}
```

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

---

## 🧪 Testing Phase 2

### Test 1: Function Works

1. Login vào app
2. Navigate tới Browse page
3. Scroll xuống Recommendations
4. Check Console:
   - `🌐 [Recs] Calling Cloud Function...`
   - `✅ [Recs] Received X movies from server`

### Test 2: Caching Works

1. F5 reload
2. Scroll lại
3. Lần đầu: Call function
4. Lần thứ 2 (trong 4 giờ): No function call, instant display

### Test 3: Firebase Logs

1. Firebase Console → Functions → Logs
2. Verify:
   - `✅ [Cloud] Completed in Xms`
   - No errors

### Test 4: Cost Monitoring

1. Firebase Console → Usage
2. Check:
   - Function invocations: Dưới 2M/month (free)
   - Firestore reads: Giảm đáng kể so với Phase 1

---

## 📊 Performance Comparison

### Before Phase 2 (Client-side)

```
User Request
  ↓
Client Hook
  ├─ Fetch watch history (Firestore)
  ├─ Call TMDB API (3 requests)
  ├─ Calculate scores (Client CPU)
  └─ Update UI
  
API Key: Exposed in client
Caching: localStorage (15min)
Firestore Reads: High
```

### After Phase 2 (Server-side)

```
User Request
  ↓
Client Hook
  ├─ Check cache (instant if fresh)
  └─ Call Cloud Function
       ↓
     Server
       ├─ Check Firestore cache (1 read)
       ├─ If stale: Calculate (hidden logic)
       ├─ Save cache (1 write)
       └─ Return results
  
API Key: Hidden in server
Caching: Firestore (4h) + localStorage (3h)
Firestore Reads: Minimal
```

---

## ✅ Success Criteria

Phase 2 thành công khi:

- [ ] Cloud Function deploy không lỗi
- [ ] Recommendations hiển thị từ server
- [ ] TMDB API key không còn trong client code
- [ ] Firestore cache hoạt động
- [ ] Function logs clean (no errors)
- [ ] Response time < 3s (cold start) hoặc < 500ms (warm)
- [ ] Cost vẫn trong free tier

---

## 🐛 Troubleshooting

### Issue: Function deployment failed

**Fix:**
```bash
# Check Firebase CLI version
firebase --version  # Should be latest

# Re-login
firebase logout
firebase login

# Check project
firebase use --add
```

### Issue: "unauthenticated" error

**Fix:**
- User chưa login
- Token expired → Logout/login lại
- Check context.auth in function

### Issue: TMDB API calls fail from function

**Fix:**
```bash
# Verify config
firebase functions:config:get

# Re-set if needed
firebase functions:config:set tmdb.key="YOUR_KEY"

# Redeploy
firebase deploy --only functions
```

### Issue: Slow cold start (>5s)

**Solutions:**
1. Set minInstances: 1 (costs money but faster)
2. Use Scheduled Functions to keep warm
3. Accept cold start (free tier trade-off)

---

## 💰 Cost Estimation

**Monthly Usage (100 active users):**

```
Function Invocations: 
  - 100 users × 5 sessions/day × 30 days = 15,000 calls
  - Free tier: 2,000,000 calls
  - Cost: $0 ✅

Firestore:
  - Cache reads: 15,000 reads
  - Cache writes: ~500 writes (when cache expires)
  - Free tier: 50,000 reads, 20,000 writes
  - Cost: $0 ✅

Total: $0/month for <1000 users
```

**At Scale (10,000 users):**
```
Estimated: $2-5/month (still very cheap)
```

---

## 📝 Next Steps

After Phase 2 completion:

1. **Monitor for 1 week**
   - Check Firebase Usage dashboard
   - Review function logs
   - Get user feedback

2. **Optional: Phase 3 (Vector Search)**
   - Integrate Pinecone
   - AI-driven recommendations
   - See RECOMMENDATION_UPGRADE_PLAN.md

3. **Production Optimizations**
   - Add request rate limiting
   - Implement error recovery
   - Setup monitoring alerts

---

## 🎯 Commit Message Template

```
feat(backend): Migrate recommendations to Cloud Functions

PHASE 2 COMPLETED:
- ✅ Created getSmartRecommendations Cloud Function
- ✅ Server-side caching with Firestore (4h TTL)
- ✅ Removed TMDB API key from client
- ✅ Optimized recommendation engine
- ✅ Security rules updated

Performance:
- Response time: <500ms (warm) / <3s (cold)
- Cost: $0/month (free tier)
- Firestore reads: 90% reduction

Testing:
- Function deployed successfully
- All recommendations work
- Cache strategy verified
- No security issues

Next: Monitor usage for 1 week before Phase 3
```

---

## 📚 References

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Callable Functions Guide](https://firebase.google.com/docs/functions/callable)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- RECOMMENDATION_UPGRADE_PLAN.md (Original plan)
- PHASE1_IMPLEMENTATION_SUMMARY.md (Previous phase)

---

**Ready to start Phase 2?** 🚀

Begin with **STEP 1** above and follow each section carefully.
Estimated completion time: **2 hours**.

Good luck! 💪
