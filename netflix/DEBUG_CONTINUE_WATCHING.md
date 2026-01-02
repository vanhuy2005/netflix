# 🐛 DEBUG GUIDE - Continue Watching Feature

## ✅ Đã Fix 2 Vấn Đề Chính

### 1️⃣ Bộ Lọc 5% (Main Issue)

**Vấn đề:** Khi test với video ngắn, percentage < 5% → không hiển thị

**Giải pháp:**

- ✅ Đổi filter từ `> 5%` → `> 0%` trong `getContinueWatching()`
- ⚠️ **LƯU Ý:** Khi deploy production, đổi lại thành `> 5%`

### 2️⃣ NaN Validation (Data Integrity)

**Vấn đề:** Dữ liệu cũ hoặc invalid values gây lỗi

**Giải pháp:**

- ✅ Thêm `Number()` conversion và NaN check
- ✅ Safe division (duration > 0)
- ✅ Round percentage to 2 decimals

---

## 🧪 TEST PROCEDURE

### Phase 1: Clear Old Data (Recommended)

```javascript
// Mở Browser Console (F12), paste và chạy:
const clearWatchHistory = async () => {
  const user = firebase.auth().currentUser;
  const profile = JSON.parse(localStorage.getItem("current_profile"));

  if (!user || !profile) {
    console.error("Not logged in or no profile selected");
    return;
  }

  const historyRef = firebase
    .firestore()
    .collection("users")
    .doc(user.uid)
    .collection("profiles")
    .doc(profile.id)
    .collection("watchHistory");

  const snapshot = await historyRef.get();
  const batch = firebase.firestore().batch();

  snapshot.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  console.log(`✅ Cleared ${snapshot.size} items`);
};

clearWatchHistory();
```

### Phase 2: Test Progress Tracking

1. **Chọn 1 phim bất kỳ** → Click Play
2. **Mở Console** (F12) → Check logs:

```
🎬 [Player] onPlayerReady fired
✅ [Player] Tracking for: "Movie Title" | Profile: John (abc123)
🚀 [Player] Initializing progress tracking...
⏱️ [Player] Starting progress tracking interval...
```

3. **Đợi 7 giây**, sẽ thấy:

```
🎥 [Player] Raw values: { currentTime: 5.2, duration: 156 }
📊 [Player] Progress: 3.3% (5.2s / 156s)
💾 [Firebase] Saved progress: 3.3% (5s / 156s) for "Movie Title"
```

4. **Click nút "🐛 Debug Progress"** (ở giữa màn hình) để check manual:

```
🐛 [DEBUG] Manual Check: {
  currentTime: 15.8,
  duration: 156,
  playerState: 1,
  percentage: "10.13%",
  isPlaying: true
}
```

### Phase 3: Test Continue Watching Row

1. **Xem 10-15 giây** → Click Back (IoArrowBack)
2. **Vào Browse Page** → Check console:

```
🔍 [Firebase] Fetched 1 watch history items
▶️ [Firebase] Continue Watching: 1 items (filtered from 1)
```

3. **Verify UI:**
   - ✅ Row "Continue Watching" xuất hiện
   - ✅ Movie card hiển thị progress bar
   - ✅ Hover vào card → thấy % đã xem

### Phase 4: Test Edge Cases

#### Test A: Video rất ngắn (< 30s)

- Xem 3s → Check percentage
- Expected: ~10-20% (depends on trailer length)

#### Test B: Xem gần hết (> 95%)

- Skip to end (click timeline)
- Expected: Row **không** hiển thị item này

#### Test C: Multiple movies

- Xem 3-4 phim khác nhau
- Expected: Row hiển thị tất cả (sorted by last_watched)

---

## 📊 EXPECTED CONSOLE OUTPUT

### ✅ Success Flow

```
🎬 [Player] onPlayerReady fired
✅ [Player] Tracking for: "Inception" | Profile: John (profile_123)
🚀 [Player] Initializing progress tracking...
⏱️ [Player] Starting progress tracking interval...

[After 7s]
🎥 [Player] Raw values: { currentTime: 5, duration: 150 }
📊 [Player] Progress: 3.33% (5s / 150s)
💾 [Firebase] Saved progress: 3.33% (5s / 150s) for "Inception"

[After 12s]
🎥 [Player] Raw values: { currentTime: 10, duration: 150 }
📊 [Player] Progress: 6.67% (10s / 150s)
💾 [Firebase] Saved progress: 6.67% (10s / 150s) for "Inception"

[Click Back → Browse Page]
🔍 [Firebase] Fetched 1 watch history items
▶️ [Firebase] Continue Watching: 1 items (filtered from 1)

Table:
┌─────────┬───────────┬────────────┬──────────────┬────────┐
│ (index) │   title   │ percentage │hasPercentage │ passed │
├─────────┼───────────┼────────────┼──────────────┼────────┤
│    0    │'Inception'│    6.67    │     true     │  true  │
└─────────┴───────────┴────────────┴──────────────┴────────┘
```

### ⚠️ Warning Scenarios

**Scenario 1: Duration = 0**

```
⚠️ [Player] Duration is 0 or NaN, player not ready yet
```

→ **Normal:** Player chưa load xong, sẽ retry sau 5s

**Scenario 2: currentTime = 0**

```
🎥 [Player] Raw values: { currentTime: 0, duration: 150 }
📊 [Player] Progress: 0.00% (0s / 150s)
💾 [Firebase] Saved progress: 0.00% (0s / 150s)
```

→ **Normal:** Video chưa play, sẽ update khi play

**Scenario 3: No Continue Watching items**

```
🔍 [Firebase] Fetched 3 watch history items
▶️ [Firebase] Continue Watching: 0 items (filtered from 3)

Table:
┌─────────┬───────────┬────────────┬──────────────┬────────┐
│ (index) │   title   │ percentage │hasPercentage │ passed │
├─────────┼───────────┼────────────┼──────────────┼────────┤
│    0    │'Movie A'  │    0.00    │     true     │ false  │ ← Too low
│    1    │'Movie B'  │   97.50    │     true     │ false  │ ← Too high
│    2    │'Movie C'  │      0     │     false    │ false  │ ← Missing field
└─────────┴───────────┴────────────┴──────────────┴────────┘
```

→ **Explanation:**

- Movie A: 0% → filtered out
- Movie B: 97.5% > 95% → filtered out
- Movie C: No percentage field → filtered out

---

## 🔍 FIRESTORE STRUCTURE CHECK

### Manual Verification (Firebase Console)

1. Open **Firebase Console** → **Firestore Database**
2. Navigate to:

   ```
   users/{uid}/profiles/{profileId}/watchHistory/{movieId}
   ```

3. **Expected Document Structure:**

   ```json
   {
     "id": 550,
     "title": "Fight Club",
     "poster_path": "/path.jpg",
     "backdrop_path": "/path.jpg",
     "progress": 15,        ✅ Must exist
     "duration": 150,       ✅ Must exist
     "percentage": 10.0,    ✅ Must exist (not NaN)
     "last_watched": Timestamp,
     "genre_ids": [18, 53],
     "vote_average": 8.4,
     "type": "movie"        ✅ New field
   }
   ```

4. **Check for Issues:**
   - ❌ `percentage: NaN` → Old data, delete document
   - ❌ `percentage: undefined` → Old data, delete document
   - ❌ `progress: "15"` (string) → Should be number
   - ✅ `percentage: 0` → Valid (video at start)

---

## 🚀 QUICK FIX COMMANDS

### If Continue Watching still empty after fixing:

```javascript
// Force update one movie's progress to test
const forceUpdateProgress = async () => {
  const user = firebase.auth().currentUser;
  const profile = JSON.parse(localStorage.getItem("current_profile"));

  await firebase
    .firestore()
    .collection("users")
    .doc(user.uid)
    .collection("profiles")
    .doc(profile.id)
    .collection("watchHistory")
    .doc("550") // Fight Club ID
    .set(
      {
        id: 550,
        title: "Fight Club",
        poster_path: "/path.jpg",
        progress: 30,
        duration: 150,
        percentage: 20.0, // 20% = will show in Continue Watching
        last_watched: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  console.log("✅ Force updated Fight Club to 20%");
};

forceUpdateProgress();
```

---

## 📝 PRODUCTION CHECKLIST

Before deploying, remember to:

- [ ] Change filter back to `> 5` in `getContinueWatching()` (firebase.js line ~581)
- [ ] Remove or reduce console.log verbosity
- [ ] Test with real user data (not just test accounts)
- [ ] Verify Firestore security rules allow read/write to watchHistory

---

## 🎯 SUCCESS CRITERIA

✅ **Progress Tracking Working:**

- Console shows "💾 [Firebase] Saved progress" every 5s
- Percentage increases over time
- Firestore document updates in real-time

✅ **Continue Watching Row Working:**

- Row visible on Browse Page
- Shows movies with 0% < progress < 95%
- Sorted by last_watched (most recent first)
- Progress bar visible on hover

✅ **Billboard Buttons Working:**

- Next/Prev buttons clickable (no overlay blocking)
- Smooth transitions between movies

---

## 🆘 TROUBLESHOOTING

| Symptom                                          | Likely Cause                     | Solution                                      |
| ------------------------------------------------ | -------------------------------- | --------------------------------------------- |
| "🎥 Raw values: { currentTime: 0, duration: 0 }" | Player not ready                 | Wait 2-3s, player still loading               |
| "⚠️ Duration is 0 or NaN"                        | Video hasn't loaded              | Normal - will retry in 5s                     |
| "Continue watching: 0 items" + Table shows items | Percentage < 0% or > 95%         | Check percentage values in table              |
| No "💾 Saved progress" logs                      | `updateWatchProgress` not called | Check Player.jsx onPlayerReady                |
| Row not visible despite data                     | `hasContinueWatching` = false    | Check BrowsePage.jsx useContinueWatching hook |

---

Generated: 2026-01-02
