# ⚡ Quick Phase 2 Testing - 5 Phút Kiểm Tra Nhanh

## 🎯 Mục Tiêu
Xác nhận Cloud Function hoạt động đúng và thay thế hoàn toàn logic client-side cũ.

---

## ✅ Test 1: Lazy Loading (30 giây)

**Thao tác**:
1. Mở `http://localhost:5173/browse`
2. Mở Console (F12)
3. **ĐỪNG** cuộn chuột - đứng yên 5 giây
4. Xem Console có dòng: `⏸️ [Recs] Hook disabled - waiting...`
5. Bây giờ cuộn xuống đến row "Recommendation"

**Kết quả mong đợi**:
```
✅ Console xuất hiện:
   "☁️ [Recs] Calling Cloud Function: getSmartRecommendations"
   "✅ [Recs] Cloud Function response received"
   "✨ [Recs] Received 20 recommendations"
```

**❌ Nếu thấy dòng sau → LỖI**:
```
"🌐 [Recs] Fetching recommendations from TMDB..."  ← CODE CŨ CHƯA XÓA!
```

---

## ✅ Test 2: Cache Hoạt Động (1 phút)

**Thao tác**:
1. Sau khi Test 1 thành công, nhấn `F5` (reload trang)
2. Cuộn lại xuống Recommendation Row
3. Xem Console

**Kết quả mong đợi**:
```
✅ Console xuất hiện:
   "💾 [Recs] Cache check: { age: '1m', isFresh: true }"
   "✅ [Recs] Using fresh cache - ZERO network requests"

❌ Không thấy dòng "☁️ [Recs] Calling Cloud Function..."
```

**Giải thích**: Cache 3 giờ → Reload lại trong vòng 3h sẽ không gọi Cloud Function.

---

## ✅ Test 3: API Key Đã Bị Ẩn (2 phút)

**QUAN TRỌNG NHẤT**: Đảm bảo TMDB API key không bị lộ!

**Thao tác**:
1. Mở DevTools → Tab **Network**
2. Xóa cache: Vào Console, gõ `localStorage.clear()`
3. Reload trang, cuộn xuống Recommendation Row
4. Trong Network Tab, lọc theo `themoviedb`

**Kết quả mong đợi**:
```
✅ KHÔNG có request nào đến api.themoviedb.org
✅ CHỈ thấy request đến asia-southeast1-<project-id>.cloudfunctions.net
```

**Kiểm tra thêm**: Xem page source (Ctrl+U), tìm "VITE_TMDB"
```
❌ KHÔNG được thấy chuỗi API key trong source code
```

---

## ✅ Test 4: Time-Based Title (1 phút)

**Thao tác**:
1. Xóa cache: `localStorage.clear()`
2. Reload và cuộn xuống Recommendation Row
3. Xem **tiêu đề** của row (text phía trên danh sách phim)

**Kết quả mong đợi** (tùy giờ hiện tại):
- **5am - 12pm**: "Khởi động ngày mới"
- **12pm - 6pm**: "Gợi ý dành riêng cho bạn"  
- **6pm - 5am**: "Phim hay buổi tối"

**Hoặc** (nếu bạn chỉ xem 1 phim):
- "Vì bạn đã xem {tên phim}"

---

## ✅ Test 5: Server Region Đúng (30 giây)

**Thao tác**:
1. Mở DevTools → Network Tab
2. Xóa cache, reload, cuộn xuống
3. Click vào request `getSmartRecommendations`
4. Xem URL

**Kết quả mong đợi**:
```
✅ URL chứa "asia-southeast1" (server Singapore)
   Ví dụ: https://asia-southeast1-netflix-clone-xxxxx.cloudfunctions.net/...
```

**❌ Nếu thấy**: `us-central1` hoặc region khác → SAI CONFIG

---

## 🎉 Tóm Tắt Kết Quả

| Test | Kết Quả |
|------|---------|
| 1. Lazy Loading | ⬜ Pass / ⬜ Fail |
| 2. Cache 3h | ⬜ Pass / ⬜ Fail |
| 3. API Key Hidden | ⬜ Pass / ⬜ Fail |
| 4. Time-Based Title | ⬜ Pass / ⬜ Fail |
| 5. Server Region | ⬜ Pass / ⬜ Fail |

**Nếu tất cả PASS** → ✅ **Phase 2 hoàn thành!**

**Nếu có FAIL** → Xem file `PHASE2_VERIFICATION_GUIDE.md` để debug chi tiết.

---

## 🐛 Xử Lý Lỗi Nhanh

### Lỗi: "functions/not-found"
```bash
# Kiểm tra function đã deploy chưa
firebase deploy --only functions:getSmartRecommendations
```

### Lỗi: "functions/unauthenticated"
```bash
# Đăng xuất rồi đăng nhập lại
```

### Lỗi: Vẫn thấy TMDB requests
```bash
# Restart dev server
# Nhấn Ctrl+C trong terminal
npm run dev
```

---

**Duration**: 5 phút  
**Prerequisite**: Cloud Function đã deploy thành công  
**Next**: Nếu pass → Deploy lên production!
