/**
 * Browser Console Reset Script
 * Run this in the browser console to force a fresh sync from MongoDB
 * 
 * HOW TO USE:
 * 1. Open your app: https://healitmedlaboratories.netlify.app/dashboard
 * 2. Press F12 to open Developer Tools
 * 3. Click "Console" tab
 * 4. Copy and paste this entire script
 * 5. Press Enter
 * 6. Refresh the page (F5)
 */

console.log('🧹 Starting localStorage cleanup...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// List of all localStorage keys to clear
const keysToRemove = [
    'healit_patients',
    'healit_visits',
    'healit_results',
    'healit_invoices',
    'healit_settings',
    'healit_profiles',
    'healit_tests_master',
    'healit_audit_logs',
    'healit_financial_expenses',
    'healit_financial_categories',
    'healit_financial_reminders',
    'healit_data_version',
    'data_migrated_to_api'
];

console.log('📊 Current localStorage data:');
keysToRemove.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
        try {
            const parsed = JSON.parse(data);
            const count = Array.isArray(parsed) ? parsed.length : (typeof parsed === 'object' ? Object.keys(parsed).length : 1);
            console.log(`   ${key}: ${count} items`);
        } catch {
            console.log(`   ${key}: exists`);
        }
    }
});

console.log('\n🗑️  Clearing localStorage...');
let clearedCount = 0;
keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        clearedCount++;
        console.log(`   ✅ Cleared: ${key}`);
    }
});

console.log(`\n✅ Cleanup complete! Cleared ${clearedCount} items.`);
console.log('🔄 Please refresh the page (F5) to sync fresh data from MongoDB.');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
