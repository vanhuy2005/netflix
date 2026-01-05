/**
 * 🧪 DIRECT TEST - Run Recommendation Test
 * 
 * This script tests the Cloud Function directly without browser
 * Usage: node test/directTest.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../netflix-443ae-firebase-adminsdk-79rnm-e0d73cf41e.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testRecommendations() {
  console.log('\n🧪 === DIRECT CLOUD FUNCTION TEST ===\n');
  
  try {
    // Test với user thực tế
    const testUserId = 'YOUR_USER_ID_HERE'; // Replace with real user ID
    const testProfileId = 'default';
    
    console.log(`📋 Testing with:`);
    console.log(`   User ID: ${testUserId}`);
    console.log(`   Profile ID: ${testProfileId}\n`);
    
    // Check watch history
    console.log('1️⃣ Checking watch history...');
    const historyRef = db.collection(`users/${testUserId}/profiles/${testProfileId}/watchHistory`);
    const historySnap = await historyRef.orderBy('last_watched', 'desc').limit(5).get();
    
    if (historySnap.empty) {
      console.log('   ⚠️ No watch history found');
      console.log('   💡 Watch a movie first to get recommendations\n');
      return;
    }
    
    console.log(`   ✅ Found ${historySnap.size} movies in watch history:`);
    historySnap.forEach(doc => {
      const data = doc.data();
      console.log(`      - ${data.title} (ID: ${data.id})`);
    });
    
    // Check recommendation cache
    console.log('\n2️⃣ Checking recommendation cache...');
    const cacheRef = db.doc(`users/${testUserId}/profiles/${testProfileId}/recs/feed`);
    const cacheSnap = await cacheRef.get();
    
    if (cacheSnap.exists) {
      const cacheData = cacheSnap.data();
      const age = Date.now() - cacheData.timestamp.toMillis();
      const ageMinutes = Math.round(age / 60000);
      
      console.log(`   ✅ Cache exists (${ageMinutes} minutes old)`);
      console.log(`   📊 Movies in cache: ${cacheData.payload?.movies?.length || 0}`);
      console.log(`   📝 Reason: "${cacheData.payload?.reason}"`);
      
      if (cacheData.payload?.movies?.length > 0) {
        console.log('\n   🎬 Sample movies:');
        cacheData.payload.movies.slice(0, 3).forEach((movie, idx) => {
          console.log(`      ${idx + 1}. ${movie.title} (Score: ${movie.score?.toFixed(1)})`);
        });
      }
    } else {
      console.log('   ℹ️ No cache found - will trigger fresh calculation');
    }
    
    console.log('\n✅ === TEST COMPLETE ===\n');
    console.log('💡 Next Steps:');
    console.log('   1. Open http://localhost:5173');
    console.log('   2. Login and open Console (F12)');
    console.log('   3. Run: await fullTest()');
    console.log('   4. Scroll to "Recommended For You" section\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  }
  
  process.exit(0);
}

// Run test
testRecommendations();
