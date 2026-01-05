# 🧪 TEST RECOMMENDATIONS - STEP BY STEP

**Status**: Cloud Function đã deploy với TMDB API key đúng ✅  
**Next**: Clear cache và test lại

---

## ⚡ QUICK TEST (2 Phút)

### **Bước 1: Mở App**
```
http://localhost:5173/
```

### **Bước 2: Open Console (F12)**

### **Bước 3: Clear All Caches**
```javascript
await clearAllRecCaches()
```

**Expected Output**:
```
🧹 [Clear All] Clearing all recommendation caches...
✅ [Clear All] Cleared localStorage: netflix_recs_kLQqXFYkBfsTEO0vCVcM
🗑️ [Clear Cache] Clearing Firestore cache for profile: kLQqXFYkBfsTEO0vCVcM
✅ [Clear Cache] Firestore recommendation cache deleted!
💡 [Clear Cache] Next Cloud Function call will recalculate fresh recommendations
✅ [Clear All] All recommendation caches cleared!
🔄 [Clear All] Please scroll to Recommendations section to trigger refresh
```

---

### **Bước 4: Scroll to Recommendations**

Scroll xuống trang Browse → "Recommended For You" section

**Should trigger**:
```
👀 [UI] User scrolled near Recommendations → Activating Engine!
☁️ [Recs] Calling Cloud Function: getSmartRecommendations
```

---

### **Bước 5: Check Logs**

**Expected (SUCCESS)**:
```
✅ [Recs] Cloud Function response received
✨ [Recs] Received 15 recommendations
📺 [Recs] Reason: "Gợi ý vì bạn đã xem Thanh Gươm Diệt Quỷ: Vô Hạn Thành"
```

**NOT (FAILURE)**:
```
📭 [Recs] No recommendations from server
```

---

## 🔍 Advanced Debug

### **Test Cloud Function Directly**
```javascript
await testCloudFunction()
```

**Expected**:
```
🧪 [Test] Testing getSmartRecommendations Cloud Function...
📋 [Test] Profile ID: kLQqXFYkBfsTEO0vCVcM
✅ [Test] Cloud Function responded in 2000ms
✨ [Test] SUCCESS! Received 15 movies
📺 [Test] Reason: "Gợi ý vì bạn đã xem Thanh Gươm Diệt Quỷ: Vô Hạn Thành"
🎬 [Test] First 3 movies:
   1. Jujutsu Kaisen 0 (ID: 642885)
   2. Attack on Titan (ID: 1429)
   3. Your Name (ID: 372058)
```

---

### **Check Firebase Logs**
```bash
firebase functions:log | Select-String "Runtime|seeds|Returned" | Select-Object -First 20
```

**Expected**:
```
🔑 [Runtime] TMDB_KEY: 0d67d10c...  ✅
📚 Found 1 seeds. IDs: 1311031
✅ Returned 15 movies. Reason: Gợi ý vì bạn đã xem Thanh Gươm Diệt Quỷ
```

**NOT**:
```
🔑 [Runtime] TMDB_KEY: NOT SET  ❌
```

---

## 🐛 If Still Empty

### **Option 1: Watch More Movies**
```
Recommendations cần ít nhất 1 phim với percentage >= 10%
```

Current: "Thanh Gươm Diệt Quỷ: Vô Hạn Thành" - 31.7% ✅

### **Option 2: Check Firestore**

1. Open Firebase Console
2. Go to Firestore Database
3. Navigate: `users/{uid}/profiles/{profileId}/watchHistory`
4. Verify có document với:
   - `id: 1311031`
   - `percentage: 31.7`
   - `last_watched: [timestamp]`

### **Option 3: Force Refresh**

```javascript
// Clear everything
await clearAllRecCaches()
quickCleanup()  // Clear ID cache too

// Refresh page
location.reload()

// After reload, scroll to Recommendations section
```

---

## ✅ Success Criteria

- [ ] `clearAllRecCaches()` → Deletes Firestore cache
- [ ] Scroll to Recommendations → Triggers Cloud Function
- [ ] Logs show: "Received X recommendations" (X > 0)
- [ ] UI displays movies (not empty section)
- [ ] Firebase logs show: "TMDB_KEY: 0d67d10c..." ✅
- [ ] Firebase logs show: "Returned X movies" (X > 0)

---

## 📊 Expected Firebase Logs (SUCCESS)

```
[Init] TMDB API Key loaded: ✅ 0d67d10c...
[Runtime] TMDB_KEY: 0d67d10c...
📚 Found 1 seeds. IDs: 1311031
🔍 Fetching recommendations for seed: Thanh Gươm Diệt Quỷ
✅ Returned 15 movies. Reason: Gợi ý vì bạn đã xem Thanh Gươm Diệt Quỷ
```

---

## 🚨 Common Issues

### **Issue: Still shows "NOT SET"**
```bash
# Verify .env exists
ls C:\Users\Admin\Desktop\netflix\netflix\functions\.env

# Check content
cat C:\Users\Admin\Desktop\netflix\netflix\functions\.env
```

### **Issue: "No recommendations from server"**
```javascript
// Clear Firestore cache
await clearFirestoreRecCache()

// Then scroll to Recommendations section
```

### **Issue: Cache not clearing**
```javascript
// Check profile ID
localStorage.getItem('currentProfileId')

// Manual clear
localStorage.clear()
```

---

**Ready to test!** 🚀

Run: `await clearAllRecCaches()` trong console
