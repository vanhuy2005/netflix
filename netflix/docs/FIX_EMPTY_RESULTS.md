# 🔧 Hướng Dẫn Test Sau Khi Fix (Empty Results Bug)

## ✅ Đã Sửa Gì?

### **Vấn đề**: Cloud Function trả về `movies: []` (danh sách rỗng)

**Nguyên nhân**:
1. **ID phim không hợp lệ**: Một số phim trong watch history có ID không tồn tại trên TMDB (lỗi 404)
2. **Filter quá chặt**: Sau khi lọc bỏ phim đã xem/đã lưu, danh sách còn lại = 0
3. **Không có fallback**: Khi rỗng, hệ thống không có phương án dự phòng

### **Giải pháp đã triển khai**:

#### ✅ **1. Bad ID Handling**
```javascript
// TRƯỚC: Nếu 1 ID lỗi → Cả function crash
axios.get(`/movie/${seed.id}/recommendations`)

// SAU: Silent fail - bỏ qua ID lỗi, tiếp tục với ID khác
.catch(err => {
  console.warn(`⚠️ Skipped seed ${seed.id}: ${err.message}`);
  return { seed, results: [] }; // Không throw error!
})
```

#### ✅ **2. Fallback Mechanism**
```javascript
// Nếu danh sách rỗng → Gọi Popular Movies
if (finalMovies.length === 0) {
  console.log("⚠️ Pool empty. Fetching Popular fallback...");
  finalMovies = await fetchPopularMovies();
  reason = "Phim phổ biến hôm nay";
}
```

#### ✅ **3. Cache Invalidation Fix**
```javascript
// Không dùng cache nếu nó rỗng (ngay cả khi chưa hết hạn)
if (age < CACHE_DURATION && d.payload?.movies?.length > 0) {
  return d.payload; // Chỉ dùng cache khi có dữ liệu thật
}
```

---

## 🧪 Cách Test (3 Bước Đơn Giản)

### **BƯỚC 1: Xóa Cache Cũ**

**Option A: Qua Console (Nhanh nhất)**
```javascript
// 1. Mở http://localhost:5173/browse
// 2. Mở Console (F12)
// 3. Gõ lệnh:
clearAllRecCache()

// Kết quả mong đợi:
// 🗑️ Deleted: netflix_recs_<profile_id>
// ✅ Cleared 1 recommendation caches from localStorage
// 🔄 Reload page now!
```

**Option B: Manual (Nếu Option A không work)**
```javascript
// Trong Console:
localStorage.clear()
```

---

### **BƯỚC 2: Reload & Test**

**Thao tác**:
1. Nhấn `F5` để reload trang
2. Cuộn xuống Recommendation Row
3. Xem Console logs

**Kết quả mong đợi** (1 trong 3 scenarios):

#### **Scenario A: Watch History Hợp Lệ** ✅
```
Console logs:
📚 Found 1 seeds. IDs: 1311031
✅ Returned 20 movies. Reason: Gợi ý vì bạn đã xem Thanh Gươm Diệt Quỷ
```
→ **Kết quả**: 20 phim gợi ý xuất hiện, title hiển thị "Gợi ý vì bạn đã xem..."

---

#### **Scenario B: Bad ID + Fallback Triggered** ✅
```
Console logs:
📚 Found 1 seeds. IDs: 1311031
⚠️ Skipped seed 1311031 (...): Request failed with status code 404
⚠️ Pool empty (bad IDs or strict filter). Fetching Popular fallback...
✅ Returned 20 movies. Reason: Phim phổ biến hôm nay
```
→ **Kết quả**: 20 phim Popular xuất hiện, title hiển thị "Phim phổ biến hôm nay"

---

#### **Scenario C: Chưa Xem Phim Nào** ✅
```
Console logs:
📚 Found 0 seeds. IDs: 
⚠️ Pool empty (bad IDs or strict filter). Fetching Popular fallback...
✅ Returned 20 movies. Reason: Phim phổ biến hôm nay
```
→ **Kết quả**: 20 phim Popular xuất hiện (empty state friendly!)

---

### **BƯỚC 3: Verify UI**

**Checklist**:
- [ ] ✅ Row title hiển thị (không còn blank)
- [ ] ✅ 20 movie cards xuất hiện
- [ ] ✅ Mỗi card có backdrop image
- [ ] ✅ Hover vào card → Có animation scale
- [ ] ✅ Click vào card → Modal mở (nếu đã implement)

---

## 🔍 Debug Nâng Cao

### **Check 1: Xem Logs Cloud Function (Google Cloud Console)**

1. Vào: https://console.firebase.google.com/project/netflix-443ae/functions/logs
2. Filter: `getSmartRecommendations`
3. Tìm log entry gần nhất

**Healthy Logs Example**:
```
📚 Found 1 seeds. IDs: 550
✅ Returned 20 movies. Reason: Gợi ý vì bạn đã xem Fight Club
```

**Error Logs Example**:
```
📚 Found 1 seeds. IDs: 9999999
⚠️ Skipped seed 9999999 (Unknown Movie): Request failed with status code 404
⚠️ Pool empty. Fetching Popular fallback...
✅ Returned 20 movies. Reason: Phim phổ biến hôm nay
```

---

### **Check 2: Verify Firestore Cache**

1. Vào: https://console.firebase.google.com/project/netflix-443ae/firestore
2. Navigate to: `users/{your_uid}/profiles/{profile_id}/recs/feed`
3. Xem field `payload.movies`

**Expected**:
```json
{
  "payload": {
    "movies": [ /* 20 items */ ],
    "reason": "Gợi ý vì bạn đã xem..."
  },
  "timestamp": "2026-01-03T..."
}
```

**If Still Empty**:
- Delete document này manual
- Reload trang để fetch lại

---

### **Check 3: Network Tab Inspection**

1. Mở DevTools → Network Tab
2. Filter: `getSmartRecommendations`
3. Click vào request → Tab **Response**

**Healthy Response**:
```json
{
  "result": {
    "movies": [
      {
        "id": 550,
        "title": "Fight Club",
        "backdrop_path": "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg",
        "vote_average": 8.4,
        "score": 12.8
      },
      // ... 19 more
    ],
    "reason": "Gợi ý vì bạn đã xem Fight Club"
  }
}
```

---

## 🎯 Success Criteria

Tất cả phải PASS:

- [x] ✅ Console không còn `📭 [Recs] No recommendations from server`
- [x] ✅ Row hiển thị 20 phim (không còn rỗng)
- [x] ✅ Title contextual (không còn blank string)
- [x] ✅ Bad IDs được skip (không crash function)
- [x] ✅ Fallback hoạt động khi cần (Popular movies)

---

## 🔄 Rollback Plan (Nếu Vẫn Lỗi)

```bash
# 1. Restore code cũ
git checkout HEAD~1 -- functions/index.js

# 2. Deploy lại
firebase deploy --only functions:getSmartRecommendations

# 3. Clear cache
# Trong Console:
clearAllRecCache()
```

---

## 📊 Expected Performance

| Scenario | Server Time | Movies Returned | Reason |
|----------|-------------|-----------------|--------|
| **Valid History** | ~1.5s | 20 | "Gợi ý vì bạn đã xem..." |
| **Bad ID + Fallback** | ~2.0s | 20 | "Phim phổ biến hôm nay" |
| **No History** | ~1.0s | 20 | "Phim phổ biến hôm nay" |
| **Cached** | < 50ms | 20 | (Same as before) |

---

## 🐛 Common Issues After Fix

### ❌ Issue: "Vẫn thấy movies: []"

**Solution**:
1. Hard refresh: `Ctrl + Shift + R`
2. Clear ALL caches:
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```
3. Check Cloud Function logs (xem có deploy thành công không)

---

### ❌ Issue: "clearAllRecCache() is not defined"

**Solution**:
```javascript
// Reload lại trang (hàm được expose khi app load)
// Hoặc import manual:
import { clearAllRecCache } from './utils/clearRecommendationCache';
clearAllRecCache();
```

---

### ❌ Issue: "Firestore permission denied khi xóa cache"

**Solution**:
- Firestore cache sẽ tự invalidate khi fetch lại
- Chỉ cần xóa localStorage là đủ:
  ```javascript
  localStorage.removeItem('netflix_recs_<profileId>')
  ```

---

## ✨ Next Steps (Nếu Test Pass)

1. **Remove Dev Tools**: Xóa dòng import trong `main.tsx` (production không cần)
   ```typescript
   // Xóa dòng này sau khi test xong:
   import './utils/clearRecommendationCache.js'
   ```

2. **Monitor Production**: Xem Cloud Function logs trong 24h đầu để catch edge cases

3. **A/B Test**: So sánh click-through rate giữa recommendations vs other rows

---

**Date**: January 3, 2026  
**Status**: 🔧 Bug Fixed - Ready for Testing  
**Deploy Time**: ~2 minutes  
**Expected Result**: ✅ Always return 20 movies (no more empty results!)
