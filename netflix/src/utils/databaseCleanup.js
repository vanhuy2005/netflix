/**
 * Database Cleanup Utility
 * Removes incorrect movie IDs from watch history and saved shows
 * 
 * Purpose: After implementing ID normalization, clean up old data
 * that contains YouTube IDs or other incorrect identifiers
 * 
 * Usage:
 * 1. Import in a debug/admin page
 * 2. Call cleanupUserData(userId, profileId)
 * 3. Or use cleanupAllProfiles() for comprehensive cleanup
 */

import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  getFirestore,
  updateDoc,
  arrayRemove 
} from "firebase/firestore";
import { app } from "../config/firebase";
import { YOUTUBE_TO_TMDB_MAP, normalizeMovieId } from "./youtubeMap";

const db = getFirestore(app);

/**
 * Get all incorrect IDs from mapping
 * @returns {Array<string>} List of incorrect IDs to remove
 */
const getIncorrectIds = () => {
  return Object.keys(YOUTUBE_TO_TMDB_MAP);
};

/**
 * Clean watch history for a specific profile
 * Removes entries with incorrect IDs
 * 
 * @param {string} userId - User UID
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object>} Cleanup statistics
 */
export const cleanupWatchHistory = async (userId, profileId) => {
  console.log(`🧹 [Cleanup] Starting watch history cleanup for profile ${profileId}`);
  
  const incorrectIds = getIncorrectIds();
  let deletedCount = 0;
  let errors = 0;

  try {
    const historyRef = collection(db, `users/${userId}/profiles/${profileId}/watchHistory`);
    const snapshot = await getDocs(historyRef);

    console.log(`📚 [Cleanup] Found ${snapshot.size} watch history entries`);

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const docId = docSnapshot.id;

      // Check if this ID is in the incorrect list
      if (incorrectIds.includes(String(docId)) || incorrectIds.includes(String(data.id))) {
        try {
          await deleteDoc(doc(db, `users/${userId}/profiles/${profileId}/watchHistory/${docId}`));
          console.log(`🗑️ [Cleanup] Deleted watch history: ${docId} (${data.title})`);
          deletedCount++;
        } catch (error) {
          console.error(`❌ [Cleanup] Error deleting ${docId}:`, error);
          errors++;
        }
      }
    }

    console.log(`✅ [Cleanup] Watch history cleanup complete. Deleted: ${deletedCount}, Errors: ${errors}`);
    return { deletedCount, errors, total: snapshot.size };
  } catch (error) {
    console.error("❌ [Cleanup] Fatal error in watch history cleanup:", error);
    throw error;
  }
};

/**
 * Clean saved shows for a specific profile
 * Removes entries with incorrect IDs
 * 
 * @param {string} userId - User UID
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object>} Cleanup statistics
 */
export const cleanupSavedShows = async (userId, profileId) => {
  console.log(`🧹 [Cleanup] Starting saved shows cleanup for profile ${profileId}`);
  
  const incorrectIds = getIncorrectIds();
  let deletedCount = 0;
  let errors = 0;

  try {
    const savedRef = collection(db, `users/${userId}/profiles/${profileId}/savedShows`);
    const snapshot = await getDocs(savedRef);

    console.log(`📚 [Cleanup] Found ${snapshot.size} saved shows`);

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const docId = docSnapshot.id;

      // Check if this ID is in the incorrect list
      if (incorrectIds.includes(String(docId)) || incorrectIds.includes(String(data.id))) {
        try {
          await deleteDoc(doc(db, `users/${userId}/profiles/${profileId}/savedShows/${docId}`));
          console.log(`🗑️ [Cleanup] Deleted saved show: ${docId} (${data.title})`);
          deletedCount++;
        } catch (error) {
          console.error(`❌ [Cleanup] Error deleting ${docId}:`, error);
          errors++;
        }
      }
    }

    console.log(`✅ [Cleanup] Saved shows cleanup complete. Deleted: ${deletedCount}, Errors: ${errors}`);
    return { deletedCount, errors, total: snapshot.size };
  } catch (error) {
    console.error("❌ [Cleanup] Fatal error in saved shows cleanup:", error);
    throw error;
  }
};

/**
 * Clean savedMovieIds array in profile document
 * Removes incorrect IDs from the denormalized array
 * 
 * @param {string} userId - User UID
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object>} Cleanup statistics
 */
export const cleanupSavedMovieIds = async (userId, profileId) => {
  console.log(`🧹 [Cleanup] Starting savedMovieIds array cleanup for profile ${profileId}`);
  
  const incorrectIds = getIncorrectIds();

  try {
    const profileRef = doc(db, `users/${userId}/profiles/${profileId}`);
    
    // Remove each incorrect ID from the array
    for (const badId of incorrectIds) {
      try {
        await updateDoc(profileRef, {
          savedMovieIds: arrayRemove(Number(badId))
        });
        console.log(`🗑️ [Cleanup] Removed ${badId} from savedMovieIds array`);
      } catch (error) {
        // Silent fail - ID might not exist in array
      }
    }

    console.log(`✅ [Cleanup] savedMovieIds array cleanup complete`);
    return { cleaned: incorrectIds.length };
  } catch (error) {
    console.error("❌ [Cleanup] Error cleaning savedMovieIds array:", error);
    throw error;
  }
};

/**
 * Complete cleanup for one profile
 * Removes all incorrect IDs from all collections
 * 
 * @param {string} userId - User UID
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object>} Comprehensive cleanup statistics
 */
export const cleanupProfile = async (userId, profileId) => {
  console.log(`🚀 [Cleanup] Starting comprehensive cleanup for profile ${profileId}`);
  
  const results = {
    watchHistory: null,
    savedShows: null,
    savedMovieIds: null,
    startTime: Date.now(),
    endTime: null,
    duration: null
  };

  try {
    // Step 1: Clean watch history
    results.watchHistory = await cleanupWatchHistory(userId, profileId);
    
    // Step 2: Clean saved shows
    results.savedShows = await cleanupSavedShows(userId, profileId);
    
    // Step 3: Clean savedMovieIds array
    results.savedMovieIds = await cleanupSavedMovieIds(userId, profileId);
    
    results.endTime = Date.now();
    results.duration = results.endTime - results.startTime;

    console.log(`✅ [Cleanup] Profile cleanup complete in ${results.duration}ms`);
    console.log(`📊 [Cleanup] Results:`, results);
    
    return results;
  } catch (error) {
    console.error("❌ [Cleanup] Fatal error in profile cleanup:", error);
    results.error = error.message;
    return results;
  }
};

/**
 * Get all profiles for a user
 * @param {string} userId - User UID
 * @returns {Promise<Array>} List of profile IDs
 */
const getUserProfiles = async (userId) => {
  try {
    const profilesRef = collection(db, `users/${userId}/profiles`);
    const snapshot = await getDocs(profilesRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("❌ [Cleanup] Error getting user profiles:", error);
    return [];
  }
};

/**
 * Clean all profiles for a user
 * WARNING: This can take several minutes for users with many profiles
 * 
 * @param {string} userId - User UID
 * @returns {Promise<Object>} Cleanup statistics for all profiles
 */
export const cleanupAllUserProfiles = async (userId) => {
  console.log(`🚀 [Cleanup] Starting cleanup for all profiles of user ${userId}`);
  
  const profiles = await getUserProfiles(userId);
  console.log(`📋 [Cleanup] Found ${profiles.length} profiles`);
  
  const results = {
    userId,
    profileCount: profiles.length,
    profiles: [],
    startTime: Date.now(),
    endTime: null,
    duration: null
  };

  for (const profile of profiles) {
    console.log(`\n🔧 [Cleanup] Processing profile: ${profile.name || profile.id}`);
    
    const profileResult = await cleanupProfile(userId, profile.id);
    results.profiles.push({
      profileId: profile.id,
      profileName: profile.name,
      ...profileResult
    });
  }

  results.endTime = Date.now();
  results.duration = results.endTime - results.startTime;

  console.log(`\n✅ [Cleanup] All profiles cleaned in ${results.duration}ms`);
  console.log(`📊 [Cleanup] Final results:`, results);
  
  return results;
};

/**
 * Dry run - preview what would be deleted without actually deleting
 * 
 * @param {string} userId - User UID
 * @param {string} profileId - Profile ID
 * @returns {Promise<Object>} Preview of items to be deleted
 */
export const previewCleanup = async (userId, profileId) => {
  console.log(`🔍 [Cleanup Preview] Analyzing profile ${profileId}`);
  
  const incorrectIds = getIncorrectIds();
  const preview = {
    watchHistory: [],
    savedShows: [],
    incorrectIdsChecked: incorrectIds
  };

  try {
    // Preview watch history
    const historyRef = collection(db, `users/${userId}/profiles/${profileId}/watchHistory`);
    const historySnapshot = await getDocs(historyRef);
    
    historySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (incorrectIds.includes(String(doc.id)) || incorrectIds.includes(String(data.id))) {
        preview.watchHistory.push({
          id: doc.id,
          title: data.title,
          last_watched: data.last_watched
        });
      }
    });

    // Preview saved shows
    const savedRef = collection(db, `users/${userId}/profiles/${profileId}/savedShows`);
    const savedSnapshot = await getDocs(savedRef);
    
    savedSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (incorrectIds.includes(String(doc.id)) || incorrectIds.includes(String(data.id))) {
        preview.savedShows.push({
          id: doc.id,
          title: data.title,
          savedAt: data.savedAt
        });
      }
    });

    console.log(`📋 [Cleanup Preview] Would delete:`, preview);
    return preview;
  } catch (error) {
    console.error("❌ [Cleanup Preview] Error:", error);
    throw error;
  }
};

// Expose to window object for console access (development only)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.cleanupProfile = cleanupProfile;
  window.cleanupAllUserProfiles = cleanupAllUserProfiles;
  window.previewCleanup = previewCleanup;
  
  console.log("🧹 [Cleanup Tools] Available in console:");
  console.log("  - previewCleanup(userId, profileId) → Preview deletions");
  console.log("  - cleanupProfile(userId, profileId) → Clean one profile");
  console.log("  - cleanupAllUserProfiles(userId) → Clean all profiles");
}

export default {
  cleanupProfile,
  cleanupAllUserProfiles,
  cleanupWatchHistory,
  cleanupSavedShows,
  cleanupSavedMovieIds,
  previewCleanup
};
