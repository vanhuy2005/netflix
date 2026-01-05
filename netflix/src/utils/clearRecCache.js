/**
 * 🧹 Clear Firestore Recommendation Cache
 * Use this to force Cloud Function to recalculate recommendations
 */

import { getFirestore, doc, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "../config/firebase";

const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Clear recommendation cache for current user's profile
 */
export const clearFirestoreRecCache = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("❌ [Clear Cache] Not logged in");
      return false;
    }

    const profileId = localStorage.getItem('currentProfileId');
    if (!profileId) {
      console.error("❌ [Clear Cache] No profile selected");
      return false;
    }

    console.log(`🗑️ [Clear Cache] Clearing Firestore cache for profile: ${profileId}`);

    const cacheRef = doc(db, `users/${user.uid}/profiles/${profileId}/recs/feed`);
    await deleteDoc(cacheRef);

    console.log("✅ [Clear Cache] Firestore recommendation cache deleted!");
    console.log("💡 [Clear Cache] Next Cloud Function call will recalculate fresh recommendations");

    return true;
  } catch (error) {
    console.error("❌ [Clear Cache] Error:", error);
    return false;
  }
};

/**
 * Clear all caches (localStorage + Firestore)
 */
export const clearAllRecCaches = async () => {
  console.log("🧹 [Clear All] Clearing all recommendation caches...");

  // 1. Clear localStorage
  const profileId = localStorage.getItem('currentProfileId');
  if (profileId) {
    const localKey = `netflix_recs_${profileId}`;
    localStorage.removeItem(localKey);
    console.log(`✅ [Clear All] Cleared localStorage: ${localKey}`);
  }

  // 2. Clear Firestore
  const result = await clearFirestoreRecCache();

  if (result) {
    console.log("✅ [Clear All] All recommendation caches cleared!");
    console.log("🔄 [Clear All] Please scroll to Recommendations section to trigger refresh");
  }

  return result;
};

// Auto-expose to window
if (typeof window !== 'undefined') {
  window.clearFirestoreRecCache = clearFirestoreRecCache;
  window.clearAllRecCaches = clearAllRecCaches;
  console.log("🧹 [Rec Cache] Clear cache commands loaded:");
  console.log("   clearFirestoreRecCache() - Clear Firestore cache only");
  console.log("   clearAllRecCaches()      - Clear all caches (localStorage + Firestore)");
}
