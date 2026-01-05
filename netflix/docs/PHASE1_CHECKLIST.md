# 📋 CHECKLIST KIỂM TRA - GIAI ĐOẠN 1

## ✅ Giai đoạn 1.1: Denormalize dữ liệu "My List"

### Bước 1: Chạy Migration Script

**Cách chạy:**
1. Mở Developer Console trong trình duyệt (F12)
2. Navigate đến trang Browse
3. Paste code sau vào Console:

```javascript
import { migrateSavedShows, verifyMigration } from './src/utils/migrateSavedMovies.js';

// Chạy migration
await migrateSavedShows();

// Kiểm tra kết quả
await verifyMigration();
```

**Hoặc tạo một nút tạm trong UI:**
- Thêm button vào BrowsePage (dev mode only)
- onClick sẽ gọi `migrateSavedShows()`

### ☑️ Checklist 1.1.1: Dữ liệu cũ

**Mục tiêu:** Vào Firebase Console, xem thử document Profile của user cũ đã xuất hiện field `savedMovieIds: [...]` chưa?

**Các bước kiểm tra:**

1. [ ] Mở Firebase Console: https://console.firebase.google.com
2. [ ] Navigate: Firestore Database → Collections
3. [ ] Path: `users/{userId}/profiles/{profileId}`
4. [ ] Tìm một profile có saved movies
5. [ ] Kiểm tra xem có field `savedMovieIds` là array không
6. [ ] Kiểm tra số lượng ID trong array có khớp với số document trong `savedShows` subcollection không

**Kết quả mong đợi:**
```json
{
  "name": "Huy",
  "avatar": "...",
  "savedMovieIds": [550, 13, 680, ...],  // ← FIELD MỚI
  "migratedAt": "2026-01-03T10:30:00.000Z"
}
```

---

### ☑️ Checklist 1.1.2: Chức năng mới

**Mục tiêu:** Bấm lưu 1 phim mới, reload lại Firebase Console, field mảng đó có thêm ID mới không?

**Các bước kiểm tra:**

1. [ ] Vào trang Browse
2. [ ] Hover vào một Movie Card chưa lưu
3. [ ] Click nút "+" (Add to My List)
4. [ ] Chờ toast notification "✓ Đã thêm vào danh sách của bạn"
5. [ ] Mở Firebase Console (tab khác)
6. [ ] Refresh document profile
7. [ ] Kiểm tra `savedMovieIds` array có chứa ID phim vừa lưu không

**Test ngược lại (Remove):**

8. [ ] Click nút "✓" (Remove from My List)
9. [ ] Chờ toast "✓ Đã xóa khỏi danh sách"
10. [ ] Refresh Firebase Console
11. [ ] Kiểm tra ID đó đã bị xóa khỏi array chưa

**Kết quả mong đợi:**
- ✅ Cả subcollection VÀ array đều được cập nhật đồng thời
- ✅ Không có lỗi console
- ✅ Toast hiển thị đúng

---

### ☑️ Checklist 1.1.3: Performance

**Mục tiêu:** Mở tab Network hoặc Console log, reload trang chủ. Dòng log `📋 [Recs] My List has...` phải hiện ra số lượng đúng **mà không** sinh ra request `Firestore (GetDocs)` nào trong tab Network cho việc lấy saved shows.

**Các bước kiểm tra:**

1. [ ] Mở DevTools (F12)
2. [ ] Chọn tab **Network**
3. [ ] Filter: Tìm kiếm "firestore" hoặc "savedShows"
4. [ ] Clear all logs (nút 🚫)
5. [ ] Reload trang Browse (F5)
6. [ ] Scroll xuống gần Recommendation Row (để trigger lazy load)

**Kiểm tra Console:**

7. [ ] Tab **Console**
8. [ ] Tìm log: `📋 [Recs] Filtering using Profile data: X movies in blacklist (ZERO reads)`
9. [ ] Kiểm tra số X có khớp với số phim đã lưu không

**Kiểm tra Network:**

10. [ ] Quay lại tab **Network**
11. [ ] **KHÔNG NÊN** thấy request nào tới path `savedShows`
12. [ ] Chỉ nên thấy request tới TMDB API (nếu cache hết hạn)

**Kết quả mong đợi:**
- ✅ Log xuất hiện với số lượng đúng
- ✅ ZERO Firestore reads cho savedShows
- ✅ Recommendation vẫn hiển thị đúng và filter out saved movies

**So sánh Before/After:**
- **TRƯỚC:** 1 getDocs call → N reads (N = số phim đã lưu)
- **SAU:** 0 reads (data có sẵn trong memory từ localStorage)

---

## ✅ Giai đoạn 1.2: Client-side Optimization

### ☑️ Checklist 1.2.1: Test Lazy Loading

**Mục tiêu:** Đảm bảo Recommendation Row không fetch ngay khi load trang, chỉ fetch khi user scroll gần tới.

**Các bước kiểm tra:**

1. [ ] Mở DevTools → Tab **Network**
2. [ ] Clear all logs
3. [ ] Reload trang Browse
4. [ ] **ĐỪNG CUỘN CHUỘT** - Chờ 3 giây

**Kiểm tra Console:**

5. [ ] Tab **Console**
6. [ ] Tìm log: `⏸️ [Recs] Hook disabled - waiting for IntersectionObserver trigger`
7. [ ] **KHÔNG NÊN** thấy log `🎬 [Recs] Fetching watch history...`

**Kiểm tra Network:**

8. [ ] Tab **Network**
9. [ ] **KHÔNG NÊN** thấy request nào tới TMDB `/recommendations` endpoint

**Bây giờ scroll xuống:**

10. [ ] Từ từ scroll xuống gần vị trí Recommendation Row
11. [ ] Ngay khi gần tới (200px trước), kiểm tra Console
12. [ ] Phải thấy log: `👀 [UI] User scrolled near Recommendations → Activating Engine!`
13. [ ] Sau đó mới thấy log: `🎬 [Recs] Fetching watch history...`
14. [ ] Tab Network lúc này mới xuất hiện requests

**Kết quả mong đợi:**
- ✅ Khi chưa scroll: **0 API calls**, **0 logs** về recommendations
- ✅ Khi scroll gần: IntersectionObserver trigger → bắt đầu fetch
- ✅ Skeleton chỉ hiện ra SAU KHI trigger, không phải ngay từ đầu

**Performance Impact:**
- Tiết kiệm **100% API quota** cho users chỉ xem banner rồi thoát
- Giảm **initial page load time**

---

### ☑️ Checklist 1.2.2: Test Cache Strategy

**Mục tiêu:** Cache phải kéo dài 3 giờ và tự động dọn rác cache quá 24h

**Test 1: Fresh Cache (< 3 giờ)**

1. [ ] Scroll xuống Recommendation Row lần đầu
2. [ ] Chờ recommendations hiển thị
3. [ ] Kiểm tra Console: `💾 [Recs] Cache updated`
4. [ ] F5 reload trang
5. [ ] Scroll lại xuống (để trigger lazy load)
6. [ ] Kiểm tra Console: `✅ [Recs] Using fresh cache - ZERO network requests`
7. [ ] Tab Network: **KHÔNG CÓ** request tới TMDB
8. [ ] Recommendations hiển thị **tức thì** (instant)

**Test 2: Stale Cache (> 3 giờ - chỉ test concept)**

Để test nhanh, tạm thời sửa `CACHE_DURATION` thành 10 giây trong code:

```javascript
// Test only - revert after
const CACHE_DURATION = 1000 * 10; // 10 seconds
```

9. [ ] Reload, scroll xuống → Cache mới được tạo
10. [ ] Chờ 11 giây
11. [ ] Reload lại
12. [ ] Scroll xuống
13. [ ] Console: `🔄 [Recs] Cache stale/outdated - will revalidate`
14. [ ] Recommendations vẫn hiện (stale cache) nhưng có loading indicator
15. [ ] Network: API calls để fetch mới

**Test 3: Corrupted Cache (> 24h)**

16. [ ] Mở DevTools → Application tab → Local Storage
17. [ ] Tìm key `netflix_recs_{profileId}`
18. [ ] Edit value, thay `timestamp` thành 2 ngày trước
19. [ ] Reload trang, scroll xuống
20. [ ] Console: `🗑️ [Recs] Cache too old (>24h) - removing`
21. [ ] Cache bị xóa và fetch lại từ đầu

**Kết quả mong đợi:**
- ✅ Fresh cache: Instant load, zero API calls
- ✅ Stale cache: Show old data first → background refresh
- ✅ Corrupted cache: Auto cleanup

---

## 📊 Tổng kết Performance Gains

### Before (Trước Giai đoạn 1)

| Metric | Value |
|--------|-------|
| **Firestore Reads (My List)** | N reads (N = số phim đã lưu) |
| **Initial API Calls** | Ngay lập tức khi load trang |
| **Cache Duration** | 15 phút |
| **Wasted Requests (user thoát sớm)** | 100% |

### After (Sau Giai đoạn 1)

| Metric | Value | Improvement |
|--------|-------|-------------|
| **Firestore Reads (My List)** | 0 reads | ✅ **100% reduction** |
| **Initial API Calls** | 0 (chỉ khi scroll tới) | ✅ **Conditional loading** |
| **Cache Duration** | 3 giờ | ✅ **12x longer** |
| **Wasted Requests** | 0% | ✅ **100% elimination** |

---

## 🐛 Common Issues & Fixes

### Issue 1: Migration script báo lỗi "Permission denied"

**Fix:** Kiểm tra Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/profiles/{profileId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Issue 2: IntersectionObserver không trigger

**Debug:**
```javascript
// Thêm log vào RecommendationRow.jsx
useEffect(() => {
  console.log("🔍 [Debug] containerRef:", containerRef.current);
  console.log("🔍 [Debug] shouldFetch:", shouldFetch);
  // ... rest of code
}, [shouldFetch]);
```

### Issue 3: user.currentProfile undefined

**Fix:** Kiểm tra localStorage có `current_profile` không:
```javascript
console.log(localStorage.getItem('current_profile'));
```

Nếu null → Logout và login lại để trigger profile selection.

---

## ✨ Success Criteria

Giai đoạn 1 được coi là **thành công** khi:

- [x] Migration script chạy không lỗi
- [x] Tất cả profile có field `savedMovieIds`
- [x] Add/Remove My List cập nhật cả 2 nơi (subcollection + array)
- [x] Zero Firestore reads khi filter recommendations
- [x] Lazy loading hoạt động (không fetch khi chưa scroll)
- [x] Cache kéo dài 3 giờ
- [x] Cache cleanup tự động (>24h)
- [x] Không có lỗi console
- [x] UX mượt mà, không lag

**Khi tất cả checklist ✅, bạn đã sẵn sàng cho Giai đoạn 2!** 🚀
