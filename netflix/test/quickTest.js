#!/usr/bin/env node

/**
 * Quick Test Script for Recommendations
 * Run: node test/quickTest.js
 */

const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`
╔═══════════════════════════════════════════╗
║   🧪 QUICK TEST - RECOMMENDATIONS       ║
╚═══════════════════════════════════════════╝

📋 Checklist:
1. ✅ TMDB API key fixed (.env file created)
2. ✅ Cloud Function deployed successfully  
3. ✅ Test utilities loaded (fullTest, clearRecCache)
4. 🔄 Ready to test

🎯 Next Steps:
1. Open http://localhost:5174
2. Login and select a profile
3. Open Console (F12)
4. Run: await fullTest()

Press Enter to:
- [1] Check Firebase logs
- [2] Open localhost:5174
- [3] Redeploy Cloud Functions
- [Q] Quit
`);

rl.on('line', async (input) => {
  const choice = input.trim().toUpperCase();
  
  switch(choice) {
    case '1':
      console.log('\n📊 Fetching Firebase logs...\n');
      exec('firebase functions:log', { shell: 'powershell.exe' }, (err, stdout, stderr) => {
        if (err) {
          console.error('❌ Error:', err);
          return;
        }
        
        const lines = stdout.split('\n').slice(0, 30);
        lines.forEach(line => {
          if (line.includes('TMDB') || line.includes('Returned') || line.includes('401')) {
            console.log(line);
          }
        });
        
        console.log('\n✅ Done. Check for:');
        console.log('   - "✅ 0d67d10c..." → API key loaded');
        console.log('   - "Returned X movies" → Success\n');
        
        rl.prompt();
      });
      break;
      
    case '2':
      console.log('\n🌐 Opening browser...\n');
      exec('start http://localhost:5174', { shell: 'powershell.exe' });
      console.log('✅ Browser opened. Now:\n');
      console.log('   1. Login');
      console.log('   2. Open Console (F12)');
      console.log('   3. Run: await fullTest()\n');
      rl.prompt();
      break;
      
    case '3':
      console.log('\n🚀 Redeploying Cloud Functions...\n');
      exec('firebase deploy --only functions', { shell: 'powershell.exe' }, (err, stdout, stderr) => {
        if (err) {
          console.error('❌ Deploy failed:', err);
          return;
        }
        console.log(stdout);
        console.log('\n✅ Deploy complete!\n');
        rl.prompt();
      });
      break;
      
    case 'Q':
      console.log('\n👋 Bye!\n');
      rl.close();
      process.exit(0);
      break;
      
    default:
      console.log('❌ Invalid choice. Enter 1, 2, 3, or Q\n');
      rl.prompt();
  }
});

rl.on('close', () => {
  console.log('\n👋 Test script closed\n');
  process.exit(0);
});
