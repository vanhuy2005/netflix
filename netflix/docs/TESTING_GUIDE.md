# 🧪 HƯỚNG DẪN KIỂM THỬ PHASE 1 - STEP BY STEP

## 📋 Chuẩn bị

### Bước 0: Khởi động ứng dụng
```bash
npm run dev
```

Đợi server chạy, mở trình duyệt tại `http://localhost:5173`

---

## ✅ TEST A: Kiểm tra Dữ liệu (Database Data)

### Bước 1: Chạy Migration Script

**Cách 1: Qua UI (Recommended)**

1. **Navigate** tới: `http://localhost:5173/dev/migration`
2. Click button **"🔍 Verify Status"**
   - Xem có bao nhiêu profile
   - Xem bao nhiêu profile đã migrate, bao nhiêu pending
3. Click button **"🚀 Run Migration"**
4. Đợi process hoàn tất (~10-30 giây)
5. Xem statistics hiển thị

**Cách 2: Qua Console (Advanced)**

1. Mở trang Browse: `http://localhost:5173/browse`
2. F12 → Console tab
3. Paste code:
```javascript
import { migrateSavedShows } from './src/utils/migrateSavedMovies.js';
await migrateSavedShows();
```

### Bước 2: Verify trong Firebase Console

1. **Mở Firebase Console**: https://console.firebase.google.com
2. **Navigate**: 
   - Firestore Database (menu bên trái)
   - Collections tab
   - `users` collection
3. **Chọn user ID** của bạn (ví dụ: `abc123xyz...`)
4. **Mở**: `profiles` subcollection
5. **Chọn một profile** (ví dụ: `profile_001`)

### ✅ Checklist A: Kết quả mong đợi

- [ ] **Field mới xuất hiện**: `savedMovieIds`
- [ ] **Kiểu dữ liệu**: `array` (hiển thị dấu `[ ]`)
- [ ] **Nội dung**: Danh sách số (ví dụ: `[550, 13, 680, 27205]`)
- [ ] **Số lượng**: Khớp với số document trong `savedShows` subcollection

**Ví dụ structure đúng:**
```
users/
  └─ abc123xyz/
      └─ profiles/
          └─ profile_001/
              ├─ name: "Huy"
              ├─ avatar: "..."
              ├─ savedMovieIds: [550, 13, 680]  ← FIELD MỚI
              ├─ migratedAt: "2026-01-03T..."
              └─ savedShows/                    ← COLLECTION CŨ (GIỮ NGUYÊN)
                  ├─ 550/
                  ├─ 13/
                  └─ 680/
```

### 🐛 Troubleshooting A

**Nếu không thấy field `savedMovieIds`:**
- Kiểm tra Console có lỗi không?
- Chạy lại migration
- Verify user đã login và có profile

**Nếu array rỗng `[]` nhưng có savedShows:**
- Migration script có thể bị lỗi
- Check Console logs
- Thử manual update 1 document

---

## ✅ TEST B: Kiểm tra "Zero Reads" (Performance Critical)

### Mục tiêu
**Đảm bảo code KHÔNG còn gọi `getDocs(savedShows)` nữa.**

### Bước 1: Setup DevTools

1. Mở trang Browse: `http://localhost:5173/browse`
2. **F12** → Mở DevTools
3. Chọn tab **Network**
4. **Filter**: Gõ `firestore` vào ô search

### Bước 2: Clear và Reload

1. Click nút **🚫 Clear** (xóa hết logs cũ)
2. **F5** Reload trang
3. **Đợi** trang load xong
4. **Scroll xuống** gần phần "Recommendations"

### ✅ Checklist B: Kết quả mong đợi

**Kiểm tra Network tab:**

- [ ] **KHÔNG ĐƯỢC** thấy request nào có:
  - Name: `query` hoặc `GetDocs`
  - URL path chứa `savedShows`
  - Method: `POST` tới Firestore

**Kiểm tra Console tab:**

- [ ] Thấy log: `📋 [Recs] Filtering using Profile data: X movies in blacklist (ZERO reads)`
- [ ] Số X khớp với số phim đã lưu

### 📊 So sánh Before/After

**TRƯỚC Phase 1.1:**
```
Network tab:
  ├─ POST firestore.googleapis.com/.../query
  │   Path: users/abc/profiles/123/savedShows
  │   Reads: 50 documents
  └─ Cost: ~$0.0018
```

**SAU Phase 1.1:**
```
Network tab:
  └─ (Không có request nào tới savedShows)
  
Console:
  └─ 📋 [Recs] ... (ZERO reads) ✅
```

### 🐛 Troubleshooting B

**Nếu VẪN thấy request tới savedShows:**

1. **Check code**: File `useSmartRecommendations.js`
   - Đảm bảo đã XÓA logic `getDocs(savedRef)`
   - Đảm bảo dùng `user.currentProfile.savedMovieIds`

2. **Check user object**:
   - F12 Console
   - Gõ: `console.log(localStorage.getItem('current_profile'))`
   - Verify có field `savedMovieIds`

3. **Clear cache**: 
   - Logout
   - Login lại
   - Chọn profile lại

---

## ✅ TEST C: Kiểm tra Lazy Loading (API Quota Savings)

### Mục tiêu
**Đảm bảo Recommendations KHÔNG fetch khi user chưa scroll tới.**

### Bước 1: Setup

1. **F12** → Network tab
2. **Clear** all logs
3. **F5** Reload trang
4. **ĐỪNG CUỘN CHUỘT** - Giữ nguyên ở đầu trang

### Bước 2: Kiểm tra Initial State

**Console tab:**
- [ ] Thấy log: `⏸️ [Recs] Hook disabled - waiting for IntersectionObserver trigger`
- [ ] **KHÔNG** thấy log: `🎬 [Recs] Fetching watch history...`

**Network tab:**
- [ ] **KHÔNG** thấy request tới `api.themoviedb.org/.../recommendations`
- [ ] Chỉ thấy requests cho:
  - Images (backdrop, poster)
  - Billboard video (nếu có)

### Bước 3: Trigger Lazy Loading

1. **Từ từ scroll xuống** về phía Recommendation Row
2. Quan sát Console

**Khi gần tới (~200px trước):**

- [ ] Console hiện: `👀 [UI] User scrolled near Recommendations → Activating Engine!`
- [ ] Sau đó mới thấy: `🎬 [Recs] Fetching watch history...`

**Network tab:**

- [ ] **BÂY GIỜ** mới thấy requests tới TMDB
- [ ] Skeleton hiển thị → Loading → Movies xuất hiện

### 📊 Impact Analysis

**User chỉ xem Banner rồi thoát:**
- TRƯỚC: Wasted 3-5 TMDB API calls
- SAU: 0 API calls ✅ (Tiết kiệm 100%)

**User scroll xuống xem:**
- TRƯỚC: Fetch ngay khi load (2-3s)
- SAU: Fetch khi scroll gần (0s wasted) ✅

### 🐛 Troubleshooting C

**Nếu vẫn fetch ngay khi load:**

1. Check `RecommendationRow.jsx`:
   - Có state `shouldFetch` không?
   - Có IntersectionObserver logic không?
   - Có placeholder `<div ref={containerRef} />` không?

2. Check `useSmartRecommendations.js`:
   - Có param `isEnabled` không?
   - Có guard clause `if (!isEnabled) return` không?

3. Verify props:
   - BrowsePage có pass `shouldFetch` state không?

---

## ✅ TEST D: Kiểm tra Đồng bộ (Sync Logic)

### Mục tiêu
**Đảm bảo khi Add/Remove phim, CẢ subcollection VÀ array đều được cập nhật.**

### Test Case 1: Add to My List

**Bước 1: Chọn phim chưa lưu**

1. Tại trang Browse
2. Hover vào một Movie Card
3. Tìm nút **"+"** (Add to My List)

**Bước 2: Click Add**

1. Click nút "+"
2. Chờ toast notification

**Checklist UI:**
- [ ] Toast hiện: `✓ Đã thêm vào danh sách của bạn`
- [ ] Nút chuyển từ "+" → "✓" (checkmark)
- [ ] Không có lỗi Console

**Bước 3: Verify Firebase**

1. **Mở Firebase Console** (tab khác)
2. Navigate tới profile document
3. **Refresh** document (nút reload ở Firebase Console)

**Checklist Firebase:**
- [ ] `savedShows` subcollection: Có thêm document mới (ID = movie ID)
- [ ] `savedMovieIds` array: Có thêm số mới (khớp movie ID)

**Example:**
```
Before:
  savedMovieIds: [550, 13]
  savedShows: [550/, 13/]

After (added movie 680):
  savedMovieIds: [550, 13, 680]  ← Added ✅
  savedShows: [550/, 13/, 680/]  ← Added ✅
```

### Test Case 2: Remove from My List

**Bước 1: Chọn phim đã lưu**

1. Hover vào một Movie Card có dấu "✓"
2. Nút hiện là "✓" (checkmark)

**Bước 2: Click Remove**

1. Click nút "✓"
2. Chờ toast

**Checklist UI:**
- [ ] Toast: `✓ Đã xóa khỏi danh sách`
- [ ] Nút chuyển từ "✓" → "+" (plus)

**Bước 3: Verify Firebase**

1. Refresh Firebase Console
2. Check profile document

**Checklist Firebase:**
- [ ] Document trong `savedShows` đã BỊ XÓA
- [ ] ID trong `savedMovieIds` array cũng BỊ XÓA

### Test Case 3: Stress Test (Add multiple)

1. Thêm 5 phim liên tiếp
2. Check Firebase: Array phải có đủ 5 ID mới
3. Xóa 3 phim
4. Check Firebase: Array giảm 3 phần tử

### 🐛 Troubleshooting D

**Nếu chỉ 1 trong 2 được cập nhật:**

1. **Check `firebase.js`**:
   - Function `saveShow()` có `Promise.all([...])` không?
   - Có cả `setDoc(showRef, ...)` VÀ `updateDoc(profileRef, { savedMovieIds: arrayUnion(...) })`?
   
2. **Check imports**:
   - Có import `updateDoc`, `arrayUnion`, `arrayRemove` không?

3. **Check error logs**:
   - Console có error về permissions không?
   - Firestore Rules có cho phép write vào profile document không?

**Nếu toast không hiện:**
- Check `react-toastify` có được setup không?
- Check network: Request có thành công (200) không?

---

## ✅ TEST E: Cache Strategy (Bonus)

### Test 1: Fresh Cache

1. Scroll xuống Recommendations (lần đầu)
2. Chờ movies hiển thị
3. **F5** reload
4. Scroll lại

**Kết quả mong đợi:**
- [ ] Console: `✅ [Recs] Using fresh cache - ZERO network requests`
- [ ] Network: Không có request TMDB
- [ ] Display: **Instant** (không có loading)

### Test 2: Cache Duration

1. Check `useSmartRecommendations.js`
2. Verify: `CACHE_DURATION = 1000 * 60 * 60 * 3` (3 hours)

### Test 3: Cache Cleanup

1. DevTools → Application → Local Storage
2. Tìm key: `netflix_recs_{profileId}`
3. Edit `timestamp` về 3 ngày trước
4. Reload page, scroll

**Kết quả:**
- [ ] Console: `🗑️ [Recs] Cache too old (>24h) - removing`
- [ ] Cache bị xóa, fetch lại từ đầu

---

## 📊 Summary Checklist - PASS/FAIL

### ✅ Giai đoạn 1.1
- [ ] **TEST A PASSED**: Firebase có `savedMovieIds` array
- [ ] **TEST B PASSED**: Zero Firestore reads cho savedShows
- [ ] **TEST D1 PASSED**: Add to My List sync cả 2 nơi
- [ ] **TEST D2 PASSED**: Remove from My List sync cả 2 nơi

### ✅ Giai đoạn 1.2
- [ ] **TEST C1 PASSED**: Không fetch khi chưa scroll
- [ ] **TEST C2 PASSED**: Fetch khi scroll gần
- [ ] **TEST E1 PASSED**: Fresh cache instant load
- [ ] **TEST E3 PASSED**: Auto cleanup old cache

---

## 🎯 Success Criteria

**Phase 1 coi là THÀNH CÔNG khi:**

✅ Tất cả 8 tests trên PASS
✅ Không có errors trong Console
✅ Firebase data structure đúng
✅ Performance improvements rõ ràng

**Nếu CÓ BẤT KỲ TEST NÀO FAIL:**
→ Xem phần Troubleshooting của test đó
→ Fix bugs
→ Re-run test
→ Document issue để tránh lặp lại

---

## 📝 Test Results Template

Copy template này để ghi kết quả:

```
=== PHASE 1 TEST RESULTS ===
Date: 2026-01-03
Tester: [Your Name]

A. DATABASE DATA
- Migration completed: ✅ / ❌
- savedMovieIds exists: ✅ / ❌
- Data count matches: ✅ / ❌

B. ZERO READS
- No Firestore requests: ✅ / ❌
- Console shows ZERO reads: ✅ / ❌

C. LAZY LOADING
- No fetch before scroll: ✅ / ❌
- Fetch triggers on scroll: ✅ / ❌

D. SYNC LOGIC
- Add syncs both places: ✅ / ❌
- Remove syncs both places: ✅ / ❌

E. CACHE
- Fresh cache instant: ✅ / ❌
- Auto cleanup works: ✅ / ❌

OVERALL: PASS ✅ / FAIL ❌

Issues found:
1. [If any]
2. [If any]

Notes:
- [Any observations]
```

---

## 🚀 Next Actions

**Nếu tất cả tests PASS:**
→ Commit changes
→ Update documentation
→ Prepare for Phase 2 (Cloud Functions)

**Nếu có tests FAIL:**
→ Debug theo Troubleshooting guides
→ Fix issues
→ Re-run full test suite
→ Don't proceed to Phase 2 until all green ✅
