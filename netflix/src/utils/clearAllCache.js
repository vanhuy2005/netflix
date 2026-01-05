/**
 * 🗑️ Clear All Cache & Cleanup Script
 * Clears all caches and temporary data from development/testing
 */

/**
 * Clear localStorage cache (ID validation cache)
 */
export function clearLocalStorageCache() {
  try {
    // Clear ID validation cache
    localStorage.removeItem('tmdb_id_validation_cache');
    console.log('✅ [Cleanup] Cleared localStorage: tmdb_id_validation_cache');

    // Clear any other Netflix caches
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('netflix') || key.includes('tmdb') || key.includes('cache'))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✅ [Cleanup] Removed: ${key}`);
    });

    console.log(`🗑️ [Cleanup] Total cleared: ${keysToRemove.length + 1} localStorage items`);
    return true;
  } catch (error) {
    console.error('❌ [Cleanup] Error clearing localStorage:', error);
    return false;
  }
}

/**
 * Clear sessionStorage
 */
export function clearSessionStorageCache() {
  try {
    const count = sessionStorage.length;
    sessionStorage.clear();
    console.log(`✅ [Cleanup] Cleared ${count} sessionStorage items`);
    return true;
  } catch (error) {
    console.error('❌ [Cleanup] Error clearing sessionStorage:', error);
    return false;
  }
}

/**
 * Clear IndexedDB (if used)
 */
export async function clearIndexedDB() {
  try {
    const databases = await indexedDB.databases();
    console.log(`🔍 [Cleanup] Found ${databases.length} IndexedDB databases`);

    for (const db of databases) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
        console.log(`✅ [Cleanup] Deleted IndexedDB: ${db.name}`);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ [Cleanup] Error clearing IndexedDB:', error);
    return false;
  }
}

/**
 * Clear browser cache (Cache API)
 */
export async function clearCacheAPI() {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`🔍 [Cleanup] Found ${cacheNames.length} caches`);

      for (const name of cacheNames) {
        await caches.delete(name);
        console.log(`✅ [Cleanup] Deleted cache: ${name}`);
      }

      return true;
    } else {
      console.log('⚠️ [Cleanup] Cache API not supported');
      return false;
    }
  } catch (error) {
    console.error('❌ [Cleanup] Error clearing Cache API:', error);
    return false;
  }
}

/**
 * Clear Service Worker cache (if exists)
 */
export async function clearServiceWorkerCache() {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`🔍 [Cleanup] Found ${registrations.length} service workers`);

      for (const registration of registrations) {
        await registration.unregister();
        console.log(`✅ [Cleanup] Unregistered service worker: ${registration.scope}`);
      }

      return true;
    } else {
      console.log('⚠️ [Cleanup] Service Workers not supported');
      return false;
    }
  } catch (error) {
    console.error('❌ [Cleanup] Error clearing Service Workers:', error);
    return false;
  }
}

/**
 * 🧹 MASTER CLEANUP - Clear everything
 */
export async function clearEverything() {
  console.log('🧹 [CLEANUP] Starting master cleanup...\n');

  const results = {
    localStorage: false,
    sessionStorage: false,
    indexedDB: false,
    cacheAPI: false,
    serviceWorker: false,
  };

  // 1. localStorage
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣ Clearing localStorage...');
  results.localStorage = clearLocalStorageCache();

  // 2. sessionStorage
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣ Clearing sessionStorage...');
  results.sessionStorage = clearSessionStorageCache();

  // 3. IndexedDB
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣ Clearing IndexedDB...');
  results.indexedDB = await clearIndexedDB();

  // 4. Cache API
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4️⃣ Clearing Cache API...');
  results.cacheAPI = await clearCacheAPI();

  // 5. Service Workers
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('5️⃣ Clearing Service Workers...');
  results.serviceWorker = await clearServiceWorkerCache();

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ [CLEANUP] Master cleanup complete!\n');
  console.log('📊 Results:');
  console.log(`   localStorage:    ${results.localStorage ? '✅' : '❌'}`);
  console.log(`   sessionStorage:  ${results.sessionStorage ? '✅' : '❌'}`);
  console.log(`   IndexedDB:       ${results.indexedDB ? '✅' : '❌'}`);
  console.log(`   Cache API:       ${results.cacheAPI ? '✅' : '❌'}`);
  console.log(`   Service Workers: ${results.serviceWorker ? '✅' : '❌'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('🔄 Please refresh the page (Ctrl+R or F5) to complete cleanup');

  return results;
}

/**
 * Quick cleanup - localStorage only (safe, fast)
 */
export function quickCleanup() {
  console.log('⚡ [Quick Cleanup] Clearing localStorage cache...');
  const result = clearLocalStorageCache();

  if (result) {
    console.log('✅ [Quick Cleanup] Done! Auto-normalization cache cleared.');
    console.log('💡 Tip: Next movie click will re-validate IDs via API');
  }

  return result;
}

// Auto-expose to window for console access
if (typeof window !== 'undefined') {
  window.clearEverything = clearEverything;
  window.quickCleanup = quickCleanup;
  window.clearLocalStorageCache = clearLocalStorageCache;
  window.clearSessionStorageCache = clearSessionStorageCache;
  window.clearIndexedDB = clearIndexedDB;
  window.clearCacheAPI = clearCacheAPI;
  window.clearServiceWorkerCache = clearServiceWorkerCache;

  console.log('🧹 [Cleanup Utils] Available commands:');
  console.log('   clearEverything()         - Clear ALL caches (full cleanup)');
  console.log('   quickCleanup()            - Clear localStorage only (fast)');
  console.log('   clearLocalStorageCache()  - Clear localStorage');
  console.log('   clearSessionStorageCache()- Clear sessionStorage');
  console.log('   clearIndexedDB()          - Clear IndexedDB');
  console.log('   clearCacheAPI()           - Clear Cache API');
  console.log('   clearServiceWorkerCache() - Unregister service workers');
}
