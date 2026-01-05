# 🧹 Cleanup Script - Hướng Dẫn Sử Dụng

## ✅ Server Đã Chạy

```
Local: http://localhost:5173/
```

---

## 🚀 QUICK CLEANUP (30 Giây)

### **Bước 1: Mở App**
- Truy cập: http://localhost:5173/
- Mở **DevTools Console** (F12)

### **Bước 2: Chạy Quick Cleanup**

```javascript
// Cách 1: Clear localStorage cache (nhanh nhất)
quickCleanup()
```

**Expected Output**:
```
⚡ [Quick Cleanup] Clearing localStorage cache...
✅ [Cleanup] Cleared localStorage: tmdb_id_validation_cache
✅ [Cleanup] Done! Auto-normalization cache cleared.
💡 Tip: Next movie click will re-validate IDs via API
```

---

### **Bước 3: Refresh Page**
```
Press F5 or Ctrl+R
```

✅ **Done!** Cache đã được clear, app sẽ re-validate IDs từ đầu.

---

## 🔥 FULL CLEANUP (1 Phút)

**Clear TẤT CẢ cache** (localStorage, sessionStorage, IndexedDB, Cache API, Service Workers):

```javascript
// Console command
await clearEverything()
```

**Expected Output**:
```
🧹 [CLEANUP] Starting master cleanup...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣ Clearing localStorage...
✅ [Cleanup] Cleared localStorage: tmdb_id_validation_cache
✅ [Cleanup] Removed: netflix_user_prefs
🗑️ [Cleanup] Total cleared: 2 localStorage items

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2️⃣ Clearing sessionStorage...
✅ [Cleanup] Cleared 5 sessionStorage items

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3️⃣ Clearing IndexedDB...
🔍 [Cleanup] Found 0 IndexedDB databases

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4️⃣ Clearing Cache API...
🔍 [Cleanup] Found 3 caches
✅ [Cleanup] Deleted cache: vite-dev
✅ [Cleanup] Deleted cache: workbox-precache
✅ [Cleanup] Deleted cache: runtime-cache

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5️⃣ Clearing Service Workers...
🔍 [Cleanup] Found 1 service workers
✅ [Cleanup] Unregistered service worker

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ [CLEANUP] Master cleanup complete!

📊 Results:
   localStorage:    ✅
   sessionStorage:  ✅
   IndexedDB:       ✅
   Cache API:       ✅
   Service Workers: ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 Please refresh the page (Ctrl+R or F5) to complete cleanup
```

**Sau đó**: Press **F5** để reload page

---

## 🛠️ INDIVIDUAL CLEANUP COMMANDS

### **1. Clear localStorage Only**
```javascript
clearLocalStorageCache()
```
- Clears ID validation cache
- Fastest cleanup
- Safe (doesn't touch database)

---

### **2. Clear sessionStorage**
```javascript
clearSessionStorageCache()
```
- Clears temporary session data
- Useful for login issues

---

### **3. Clear IndexedDB**
```javascript
await clearIndexedDB()
```
- Clears offline database
- Rarely needed

---

### **4. Clear Cache API**
```javascript
await clearCacheAPI()
```
- Clears HTTP caches
- Useful for asset updates

---

### **5. Clear Service Workers**
```javascript
await clearServiceWorkerCache()
```
- Unregisters service workers
- Fixes PWA issues

---

## 📊 Verify Cleanup

### **Check Cache Status**
```javascript
// Before cleanup
getCacheStats()
// → { size: 10, entries: [...] }

// After cleanup
getCacheStats()
// → { size: 0, entries: [] }
```

### **Check localStorage**
```javascript
// Should be null after cleanup
localStorage.getItem('tmdb_id_validation_cache')
// → null
```

---

## 🎯 Recommended Cleanup Workflow

### **Scenario 1: Testing Auto-Normalization**

```javascript
// 1. Clear cache
quickCleanup()

// 2. Refresh page (F5)

// 3. Test movie clicks (will re-validate from scratch)
await autoNormalizeMovieId(83533, "Avatar")
```

---

### **Scenario 2: Full Reset (Bắt Đầu Từ Đầu)**

```javascript
// 1. Full cleanup
await clearEverything()

// 2. Refresh page (F5)

// 3. Re-login (if needed)

// 4. Test from scratch
```

---

### **Scenario 3: Clear Cache Định Kỳ (Maintenance)**

```javascript
// Chạy mỗi tuần
quickCleanup()
// → Keeps cache fresh, removes old validations
```

---

## ⚠️ WARNINGS

### **Database Cleanup (DANGEROUS)**

**⚠️ CẨN THẬN**: Các lệnh này XÓA USER DATA!

```javascript
// Preview cleanup (SAFE - chỉ xem)
await previewCleanup(user, profileId)
// → Shows what will be deleted

// Cleanup single profile (CAUTION)
await cleanupProfile(user, profileId)
// → Removes bad IDs from watchHistory + savedShows

// Cleanup all profiles (DANGEROUS)
await cleanupAllUserProfiles(user)
// → Removes bad IDs from ALL profiles
```

**Recommendation**: Chỉ dùng khi CHẮC CHẮN có data rác trong Firestore.

---

## 🧪 Test After Cleanup

### **Test 1: Cache Empty**
```javascript
getCacheStats()
// → { size: 0, entries: [] } ✅
```

### **Test 2: Re-Validation Works**
```javascript
await autoNormalizeMovieId(83533, "Avatar")
// → Should validate via API (not cache)
// → Logs: "🔍 [ID Validate] Validating 83533..."
```

### **Test 3: Cache Rebuilds**
```javascript
// Click 5 movies
// Then check:
getCacheStats()
// → { size: 5, entries: [...] } ✅
```

---

## 🔄 After Cleanup Checklist

- [ ] **Cache cleared**: `getCacheStats()` returns 0
- [ ] **localStorage empty**: No `tmdb_id_validation_cache`
- [ ] **Page refreshed**: Press F5
- [ ] **Re-login** (if needed)
- [ ] **Test normalization**: Click movie, check console logs
- [ ] **Cache rebuilds**: Verify cache populates on movie clicks

---

## 💡 Tips

### **When to Use Quick Cleanup**
- Testing auto-normalization changes
- Cache acting weird
- Want to force re-validation

### **When to Use Full Cleanup**
- Major app changes
- PWA issues
- Service worker stuck
- Complete fresh start

### **When to Use Database Cleanup**
- Firestore has bad IDs (verify first!)
- After manual data migration
- **ONLY if** `previewCleanup()` shows bad data

---

## 📚 Available Commands Summary

```javascript
// SAFE & FAST ✅
quickCleanup()                // Clear localStorage (recommended)
clearLocalStorageCache()      // Same as above
getCacheStats()               // Check cache status

// FULL CLEANUP 🔥
await clearEverything()       // Clear ALL caches

// INDIVIDUAL 🛠️
clearSessionStorageCache()    // Clear session
await clearIndexedDB()        // Clear IndexedDB
await clearCacheAPI()         // Clear HTTP cache
await clearServiceWorkerCache() // Clear service workers

// DATABASE (DANGEROUS) ⚠️
await previewCleanup(user, profileId)      // Preview only (safe)
await cleanupProfile(user, profileId)      // Clean 1 profile
await cleanupAllUserProfiles(user)         // Clean all (dangerous)
```

---

## 🚀 Quick Start (Copy-Paste)

```javascript
// 1. Quick cleanup
quickCleanup()

// 2. Refresh
// Press F5

// 3. Test
await autoNormalizeMovieId(83533, "Avatar")
getCacheStats()
```

---

**Status**: ✅ Cleanup utilities ready  
**Location**: http://localhost:5173/ (DevTools Console F12)  
**Recommended**: Start with `quickCleanup()` - safest & fastest
