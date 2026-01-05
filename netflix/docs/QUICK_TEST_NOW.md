# 🧪 QUICK TEST GUIDE - Recommendations

## ✅ FIXED: TMDB API Key Issue
- **Problem**: Cloud Function không load được TMDB API key → 401 errors
- **Solution**: Migrated to dotenv with `.env` file in functions/
- **Status**: ✅ Deployed successfully (logs show "✅ 0d67d10c...")

## 🚀 HOW TO TEST NOW

### Step 1: Open App
```bash
# Server should be running at http://localhost:5174
# If not, run: npm run dev
```

### Step 2: Login
1. Go to http://localhost:5174
2. Login with your account
3. Select a profile

### Step 3: Open Console & Run Test
Press `F12` to open DevTools, then run:

```javascript
await fullTest()
```

**What it does:**
1. Clears Firestore recommendation cache
2. Clears localStorage cache  
3. Calls Cloud Function directly
4. Shows detailed results

### Step 4: Check Results
Expected console output:
```
🧪 === FULL RECOMMENDATION TEST ===

1️⃣ Clearing Firestore cache...
✅ Firestore cache cleared for profile: default

2️⃣ Testing Cloud Function...
✅ [Test] Cloud Function responded in 2500ms
✨ [Test] SUCCESS! Received 15 movies
📺 [Test] Reason: "Vì bạn đã xem Thanh Gươm Diệt Quỷ: Vô Hạn Thành"
🎬 [Test] First 3 movies:
   1. Jujutsu Kaisen 0 (ID: 656663)
   2. Naruto Shippuden (ID: 31910)
   3. Attack on Titan (ID: 1429)

📊 === SUMMARY ===
✅ SUCCESS: 15 movies received
📝 Reason: Vì bạn đã xem Thanh Gươm Diệt Quỷ: Vô Hạn Thành
✨ Scroll down to 'Recommended For You' section to see results!
```

### Step 5: Verify in UI
1. Scroll down to "Recommended For You" section
2. Should see 10-20 movie cards
3. Movies should be relevant to your watch history

## 🔧 Alternative Commands

### Test Cloud Function Only (no cache clear)
```javascript
await testCloudFunction()
```

### Clear Cache Only (no test)
```javascript
await clearRecCache()
```

## ❌ IF STILL FAILING

### Check Firebase Logs
```bash
firebase functions:log | Select-Object -First 30
```

**Look for:**
- ❌ "TMDB_KEY: NOT SET" → .env file missing
- ❌ "401" → API key wrong
- ✅ "✅ 0d67d10c..." → API key loaded correctly
- ✅ "Returned X movies" where X > 0

### Re-deploy if needed
```bash
firebase deploy --only functions
```

### Check .env file exists
```bash
Get-Content functions/.env
```

Should show:
```
TMDB_API_KEY=0d67d10cf671783c1184f82f5f840cc5
TMDB_BASE_URL=https://api.themoviedb.org/3
```

## 📊 Expected Behavior

### With Watch History (1+ movies watched)
- Returns 10-20 personalized recommendations
- Reason: "Vì bạn đã xem [movie title]"
- Movies are similar to what you watched

### Without Watch History (0 movies watched)
- Returns empty array
- Reason: "Hãy xem vài phim để nhận gợi ý!"
- This is normal - watch a movie first

## ✨ Success Criteria
1. ✅ Console shows "SUCCESS: X movies received" where X > 0
2. ✅ UI displays movie cards in "Recommended For You"
3. ✅ Firebase logs show no 401 errors
4. ✅ Movies are relevant to watch history

## 🎯 Current Status
- ✅ TMDB API key configured correctly
- ✅ Cloud Function deployed with dotenv
- ✅ Build logs show API key loading
- 🔄 **NEEDS TESTING** - User must run `fullTest()` to verify
