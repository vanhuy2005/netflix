# ⚡ Quick Test - ID Normalization (3 Phút)

## ✅ Đã Sửa Gì?

**Vấn đề**: Nhấn phim này ra phim khác (YouTube ID vs TMDB ID)  
**Giải pháp**: Normalize tất cả IDs thành TMDB IDs trước khi lưu/điều hướng

---

## 🧪 BƯỚC 1: Test Navigation (1 phút)

1. **Mở**: http://localhost:5173/browse
2. **Mở Console** (F12)
3. **Click vào phim bất kỳ** (Banner hoặc Row)

**Kết quả mong đợi**:
```
Console logs:
✅ "🔧 [Billboard] Play clicked: 83533 → 933260"
   hoặc
✅ "▶️ [MovieCard] Navigating (normalized): 83533 → 933260"
```

**❌ Nếu không thấy log** → Import thiếu, check lại code

---

## 🧪 BƯỚC 2: Test Database Save (1 phút)

1. **Click nút "Add to My List"** (dấu +) trên bất kỳ phim nào
2. **Xem Console**

**Kết quả mong đợi**:
```
✅ "🔧 [Save] Normalized ID: 83533 → 933260"
✅ "💾 saveShow called: { movieId: 933260, ... }"
```

3. **Verify trong Firestore**:
   - Firebase Console → Firestore
   - `users/{uid}/profiles/{pid}/savedShows/{movieId}`
   - **Check**: Document ID = `933260` (NOT `83533`)

---

## 🧹 BƯỚC 3: Clean Old Data (1 phút)

**Nếu database có data cũ (bad IDs)**:

```javascript
// 1. Get user info
const user = auth.currentUser;
const userId = user.uid;
const profile = JSON.parse(localStorage.getItem('current_profile'));
const profileId = profile.id;

// 2. Preview cleanup (xem sẽ xóa gì)
await previewCleanup(userId, profileId);

// 3. Run cleanup (nếu OK)
await cleanupProfile(userId, profileId);

// Expected output:
// ✅ "🧹 [Cleanup] Profile cleanup complete"
// ✅ "Deleted: X items"
```

---

## ✅ Success Checklist

- [ ] Console hiển thị normalization logs
- [ ] Firestore chỉ chứa TMDB IDs (6-7 digits)
- [ ] Click phim → Ra đúng phim
- [ ] Recommendation Row hiển thị (không rỗng)

---

## 🐛 Nếu Vẫn Lỗi

### Lỗi: "Không thấy log normalization"
```bash
# Restart dev server
npm run dev
```

### Lỗi: "Firestore vẫn có bad IDs"
```javascript
// Run toàn bộ cleanup
await cleanupAllUserProfiles(userId);
```

### Lỗi: "Module not found"
```bash
# Check imports
grep -r "normalizeMovieId" src/
```

---

**Thời gian**: 3 phút  
**Chi tiết**: Xem [ID_NORMALIZATION_FIX.md](ID_NORMALIZATION_FIX.md)
