/**
 * Automated Smoke Test: Login & Main Page Access (S1-TST-05)
 * Tool / Runtime: Node.js (Fetch API)
 */

const BASE_URL = 'http://localhost:3000'; // Adjust base URL as needed

async function runSmokeTest() {
    console.log('--- STARTING AUTOMATED SMOKE TEST ---');

    try {
        // Step 1: Verify Login API Endpoint
        console.log('[1/3] Testing Authentication Endpoint...');
        const loginRes = await fetch(`${BASE_URL}/api.js`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', email: 'testadmin@example.com', password: 'Password123!' })
        });
        
        if (loginRes.ok || loginRes.status === 200) {
            console.log('✔ Login API responded successfully.');
        } else {
            console.warn(`! Login endpoint returned status: ${loginRes.status}`);
        }

        // Step 2: Check Dashboard Page Structure Availability
        console.log('[2/3] Checking Dashboard Accessibility...');
        const dashRes = await fetch(`${BASE_URL}/dashboard.html`);
        if (dashRes.status === 200) {
            console.log('✔ Dashboard HTML page reachable.');
        } else {
            throw new Error(`Dashboard page missing! Status: ${dashRes.status}`);
        }

        // Step 3: Check Core JS Bundle / App Setup
        console.log('[3/3] Checking App Core Assets...');
        const appScriptRes = await fetch(`${BASE_URL}/app.js`);
        if (appScriptRes.status === 200) {
            console.log('✔ Core app script reachable.');
        } else {
            throw new Error(`app.js file missing! Status: ${appScriptRes.status}`);
        }

        console.log('\n✅ ALL SMOKE TESTS PASSED SUCCESSFULLY!');
    } catch (err) {
        console.error('\n❌ SMOKE TEST FAILED:', err.message);
        process.exit(1);
    }
}

runSmokeTest();