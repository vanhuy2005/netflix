/**
 * 🧪 Test Cloud Function - Manual Trigger
 * Use this in browser console to test getSmartRecommendations after deployment
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "../config/firebase";

const functions = getFunctions(app, 'asia-southeast1');
const db = getFirestore(app);

/**
 * FULL TEST: Clear cache + Test Cloud Function
 * Usage in console: await fullTest()
 */
export const fullTest = async () => {
  console.log("🧪 === FULL RECOMMENDATION TEST ===\n");
  
  // Step 1: Clear cache
  console.log("1️⃣ Clearing Firestore cache...");
  await clearRecCache();
  
  // Step 2: Clear localStorage
  const oldCache = localStorage.getItem('netflix_recs_default');
  if (oldCache) {
    localStorage.removeItem('netflix_recs_default');
    console.log("✅ localStorage recommendation cache cleared");
  }
  
  // Step 3: Test Cloud Function
  console.log("\n2️⃣ Testing Cloud Function...");
  const result = await testCloudFunction();
  
  // Summary
  console.log("\n📊 === SUMMARY ===");
  if (result.success) {
    console.log(`✅ SUCCESS: ${result.count} movies received`);
    console.log(`📝 Reason: ${result.reason}`);
    console.log("\n✨ Scroll down to 'Recommended For You' section to see results!");
  } else {
    console.error("❌ FAILED: No recommendations");
    console.log("💡 Check Firebase logs: firebase functions:log");
  }
  
  return result;
};

/**
 * Clear Firestore recommendation cache only
 */
export const clearRecCache = async () => {
  try {
    const auth = getAuth(app);
    const user = auth.currentUser;
    
    if (!user) {
      console.warn("⚠️ Not logged in - cannot clear Firestore cache");
      return;
    }
    
    const profileId = localStorage.getItem('currentProfileId') || 'default';
    const cacheRef = doc(db, `users/${user.uid}/profiles/${profileId}/recs/feed`);
    
    await deleteDoc(cacheRef);
    console.log(`✅ Firestore cache cleared for profile: ${profileId}`);
  } catch (err) {
    if (err.code === 'not-found') {
      console.log("✅ No cache to clear (fresh state)");
    } else {
      console.warn("⚠️ Error clearing cache:", err.message);
    }
  }
};

/**
 * Test Cloud Function with current profile
 */
export const testCloudFunction = async () => {
  try {
    console.log("🧪 [Test] Testing getSmartRecommendations Cloud Function...");
    
    // Get current profile from localStorage
    const profileId = localStorage.getItem('currentProfileId');
    
    if (!profileId) {
      console.error("❌ [Test] No profile selected. Please login and select a profile first.");
      return;
    }
    
    console.log(`📋 [Test] Profile ID: ${profileId}`);
    
    // Call Cloud Function
    const getRecommendations = httpsCallable(functions, "getSmartRecommendations");
    const startTime = Date.now();
    
    const result = await getRecommendations({ profileId });
    const duration = Date.now() - startTime;
    
    console.log(`✅ [Test] Cloud Function responded in ${duration}ms`);
    console.log("📦 [Test] Response:", result.data);
    
    const { movies, reason } = result.data;
    
    if (movies && movies.length > 0) {
      console.log(`✨ [Test] SUCCESS! Received ${movies.length} movies`);
      console.log(`📺 [Test] Reason: "${reason}"`);
      console.log("🎬 [Test] First 3 movies:");
      movies.slice(0, 3).forEach((movie, idx) => {
        console.log(`   ${idx + 1}. ${movie.title} (ID: ${movie.id})`);
      });
      return { success: true, count: movies.length, reason };
    } else {
      console.log("⚠️ [Test] FAILED - No movies returned");
      console.log("📭 [Test] Reason:", reason || "Unknown");
      return { success: false, count: 0, reason };
    }
    
  } catch (error) {
    console.error("❌ [Test] Error:", error);
    return { success: false, error: error.message };
  }
};

// Auto-expose to window
if (typeof window !== 'undefined') {
  window.fullTest = fullTest;
  window.testCloudFunction = testCloudFunction;
  window.clearRecCache = clearRecCache;
  console.log("🧪 [Test Utils] Available commands:");
  console.log("   fullTest() - Complete test (clear cache + test)");
  console.log("   testCloudFunction() - Test Cloud Function only");
  console.log("   clearRecCache() - Clear Firestore cache only");
}
