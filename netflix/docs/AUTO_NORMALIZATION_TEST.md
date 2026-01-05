# 🧪 Test Auto ID Normalization

## ✅ Setup Complete

**Files Updated**:
- ✅ `src/utils/youtubeMap.js` - Auto-normalization engine
- ✅ `src/config/firebase.js` - All save functions use async validation
- ✅ `docs/AUTO_ID_NORMALIZATION.md` - Complete documentation

---

## 🚀 Quick Test (3 Minutes)

### **Test 1: Click Movie with Bad ID**

1. **Mở app**: `npm run dev`
2. **Login** và chọn profile
3. **Mở DevTools Console** (F12)
4. **Click vào bất kỳ movie nào**

**Expected Console Output**:
```
🔍 [Auto Normalize] Checking ID: 83533
❌ [ID Validate] ID 83533 not found on TMDB (404)
🔍 [Auto Normalize] ID 83533 invalid, searching by title: "Avatar: Fire and Ash"
🔍 [Title Search] Searching TMDB for: "Avatar: Fire and Ash"
🔍 [Title Search] Found "Avatar: Fire and Ash" → 933260 (Avatar: Fire and Ash)
✅ [Auto Normalize] Auto-fixed: 83533 → 933260
💾 [Auto Normalize] Cached: 83533 → 933260
▶️ Playing: Avatar: Fire and Ash (ID: 933260)
```

**✅ Pass Criteria**:
- ID tự động được sửa từ `83533` → `933260`
- Phim phát đúng trailer
- Cache lưu kết quả

---

### **Test 2: Click Same Movie Again (Cache Test)**

1. **Quay lại Browse page**
2. **Click lại movie vừa test**

**Expected Output**:
```
💾 [Auto Normalize] Cache hit: 83533 → 933260
▶️ Playing: Avatar: Fire and Ash (ID: 933260)
```

**✅ Pass Criteria**:
- Không gọi API (cache hit)
- Phát ngay lập tức
- Thời gian < 1ms

---

### **Test 3: Save to My List (Database Test)**

1. **Click nút "➕" (Add to My List)** trên movie card

**Expected Output**:
```
🔧 [Auto Normalize] Normalizing object: { id: 83533, title: "Avatar: Fire and Ash" }
💾 [Auto Normalize] Cache hit: 83533 → 933260
💾 Saving to Firestore: { id: 933260, title: "Avatar: Fire and Ash", ... }
✅ Movie saved successfully (both subcollection + array)!
```

**✅ Pass Criteria**:
- Database lưu ID `933260` (đúng)
- KHÔNG lưu `83533` (sai)
- Toast "✓ Đã thêm vào danh sách của bạn"

---

### **Test 4: Watch History (Progress Test)**

1. **Phát video** (click play)
2. **Xem 10-20 giây** rồi thoát

**Expected Output**:
```
🔧 [Progress] Normalized ID: 83533 → 933260
💾 [Firebase] Saving to Firestore: { id: 933260, percentage: 15.5, ... }
✅ [Firebase] Successfully saved: 15.5% for "Avatar: Fire and Ash"
```

**✅ Pass Criteria**:
- Watch history lưu ID `933260`
- Continue Watching hiển thị đúng phim
- Progress bar hiển thị %

---

### **Test 5: Recommendations (Logic Test)**

1. **Sau khi xem phim** (Test 4)
2. **Quay lại Browse page**
3. **Scroll xuống "Recommended For You"**

**Expected Console**:
```
📊 [Smart Rec] Sending seed IDs: [933260, ...]
✅ [Cloud Function] Recommendations fetched successfully
🎬 Recommended Movies: ["The Way of Water", "Endgame", ...]
```

**✅ Pass Criteria**:
- Seed IDs là `933260` (đúng) KHÔNG phải `83533` (sai)
- Recommendations liên quan đến Avatar (action/sci-fi)
- KHÔNG random movies

---

## 🔍 Advanced Tests (Optional)

### **Test 6: Multiple Bad IDs**

Test với nhiều phim có ID sai:

```javascript
// Console command
const testMovies = [
  { id: 83533, title: "Avatar: Fire and Ash" },
  { id: 12345, title: "Inception" },
  { id: 99999, title: "The Matrix" }
];

for (const movie of testMovies) {
  const validId = await autoNormalizeMovieId(movie.id, movie.title);
  console.log(`${movie.id} → ${validId}`);
}
```

**Expected**:
```
83533 → 933260 (Avatar)
12345 → 27205 (Inception)
99999 → 603 (The Matrix)
```

---

### **Test 7: Cache Statistics**

```javascript
// Console command
getCacheStats()
```

**Expected**:
```
{
  size: 5,
  entries: [
    ["83533", 933260],
    ["12345", 27205],
    ["99999", 603],
    // ...
  ]
}
```

---

### **Test 8: Network Failure (Offline Test)**

1. **Mở DevTools** → Network tab
2. **Set to "Offline"**
3. **Click movie**

**Expected**:
```
⚠️ [Auto Normalize] Could not normalize 83533, using original
▶️ Playing: Avatar (ID: 83533)
```

**✅ Pass Criteria**:
- App không crash
- Fallback về ID gốc
- User vẫn xem được phim (có thể sai trailer)

---

## 📊 Check Database (Firestore)

### **Path**: `users/{uid}/profiles/{pid}/watchHistory`

**Before Auto-Normalize**:
```json
{
  "83533": {
    "id": 83533,  ❌ Bad ID
    "title": "Avatar",
    "last_watched": "..."
  }
}
```

**After Auto-Normalize**:
```json
{
  "933260": {
    "id": 933260,  ✅ Correct ID
    "title": "Avatar: Fire and Ash",
    "last_watched": "..."
  }
}
```

---

## 🐛 Debugging Commands

### **Clear Cache** (if testing fails)
```javascript
clearIdCache()
// Clears all cached IDs, forces re-validation
```

### **Check Specific ID**
```javascript
await autoNormalizeMovieId(83533, "Avatar")
// Returns corrected ID + logs full process
```

### **Validate Manually**
```javascript
await validateMovieId(933260)
// Returns: true (valid ID)

await validateMovieId(83533)
// Returns: false (invalid ID)
```

---

## ✅ Success Criteria Checklist

- [ ] **Bad IDs auto-corrected** - `83533` → `933260`
- [ ] **Cache works** - Second click instant (no API call)
- [ ] **Database correct** - Firestore has `933260`, not `83533`
- [ ] **Recommendations work** - Based on valid seed IDs
- [ ] **No errors** - Console clean (no red errors)
- [ ] **Toast messages** - "✓ Đã thêm vào danh sách của bạn"

---

## 🎯 Expected Results Summary

| Action | Before | After |
|--------|--------|-------|
| **Click Avatar** | Plays wrong trailer | ✅ Plays correct trailer |
| **Save to My List** | Saves ID 83533 | ✅ Saves ID 933260 |
| **Watch History** | Records 83533 | ✅ Records 933260 |
| **Recommendations** | Random/broken | ✅ Avatar-related (sci-fi/action) |
| **API Calls** | None (broken) | ✅ 2 calls (validate + search) |
| **Cache** | N/A | ✅ 83533 → 933260 |

---

## 🚨 If Tests Fail

### **Issue 1: Still seeing wrong movie**

**Check**:
```javascript
// Console
await autoNormalizeMovieId(movieId, movieTitle)
// Should return correct ID
```

**Fix**: Clear cache and re-test
```javascript
clearIdCache()
```

---

### **Issue 2: API errors (429 Too Many Requests)**

**Cause**: Rate limit (40 requests/10 seconds)

**Fix**: Wait 10 seconds, cache will prevent future issues

---

### **Issue 3: Cache not persisting**

**Check localStorage**:
```javascript
// Console
localStorage.getItem('tmdb_id_validation_cache')
```

**Fix**: Check browser storage permissions

---

## 📝 Test Report Template

```
Date: ___________
Tester: ___________

Test 1 (Click Movie): [ ] Pass [ ] Fail
Test 2 (Cache): [ ] Pass [ ] Fail
Test 3 (Save to List): [ ] Pass [ ] Fail
Test 4 (Watch History): [ ] Pass [ ] Fail
Test 5 (Recommendations): [ ] Pass [ ] Fail

Notes:
_________________________________
_________________________________
_________________________________

Issues Found:
_________________________________
_________________________________
_________________________________
```

---

**Ready to test!** 🚀

Run: `npm run dev` và làm theo từng test trên.

Expected time: **3-5 minutes** cho basic tests.
