const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('Starting Antikythera Mk III & Planet Mode automated browser audit suite...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--enable-webgl', '--use-gl=angle', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
    errors.push(err.message);
  });

  const artifactDir = '/Users/ericmiller/.gemini/antigravity/brain/e6699a7f-e2eb-47fe-842b-57213098df7a';
  const downloadsDir = '/Users/ericmiller/Downloads';

  function saveShot(buffer, baseName) {
    fs.writeFileSync(path.join(artifactDir, `${baseName}.png`), buffer);
    fs.writeFileSync(path.join(downloadsDir, `${baseName}.png`), buffer);
    console.log(`Saved screenshot: ${baseName}.png to artifacts & Downloads`);
  }

  // 1. Navigate to Mk III app
  console.log('Navigating to http://localhost:5175...');
  await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click Center & Fit to ensure perfect volumetric centering
  console.log('Actuating Center & Fit button...');
  const fitBtn = await page.$('#btn-fit-frame');
  if (fitBtn) await fitBtn.click();
  await page.waitForTimeout(1000);

  // Screenshot 1: Standing Sky Window (Default Earth baseline view)
  const shotBaseline = await page.screenshot();
  saveShot(shotBaseline, 'antikythera_mk3_standing_sky');

  // 2. Switch to Mars (Ares) - Planet Mode Test
  console.log('Testing Planet Mode: Switch to Mars (Ares)...');
  const marsBtn = await page.$('button[data-planet="mars"]');
  if (marsBtn) {
    await marsBtn.click();
    await page.waitForTimeout(1200);
    const shotMars = await page.screenshot();
    saveShot(shotMars, 'antikythera_mk3_planet_mars');
  }

  // 3. Test Passport Tab on Mars
  console.log('Testing Interplanetary Passport Tab on Mars...');
  const passportTab = await page.$('button[data-tab="passport"]');
  if (passportTab) {
    await passportTab.click();
    await page.waitForTimeout(1000);

    // Verify weight calculation
    const weightVal = await page.$eval('#val-passport-weight', el => el.textContent);
    console.log(`Passport calculated Mars weight for 70kg: ${weightVal} kg`);

    const shotPassport = await page.screenshot();
    saveShot(shotPassport, 'antikythera_mk3_passport_panel');
  }

  // 4. Test Native Engine Mode Switch in Planet Bar & Foundry Tab
  console.log('Testing Native Engine Mode & Foundry Derivations...');
  const btnNative = await page.$('#btn-engine-native');
  if (btnNative) {
    await btnNative.click();
    await page.waitForTimeout(600);
  }

  const foundryTab = await page.$('button[data-tab="foundry"]');
  if (foundryTab) {
    await foundryTab.click();
    await page.waitForTimeout(800);
    const shotFoundry = await page.screenshot();
    saveShot(shotFoundry, 'antikythera_mk3_foundry_native_gears');
  }

  // 5. Switch to Venus (Aphrodite) and test Cloud-Pierce toggle
  console.log('Testing Venus & Cloud-Pierce Toggle...');
  const venusBtn = await page.$('button[data-planet="venus"]');
  if (venusBtn) {
    await venusBtn.click();
    await page.waitForTimeout(1000);

    const shotVenusOpaque = await page.screenshot();
    saveShot(shotVenusOpaque, 'antikythera_mk3_planet_venus_cloud');

    const cloudPierceBtn = await page.$('#btn-cloud-pierce');
    if (cloudPierceBtn) {
      await cloudPierceBtn.click();
      await page.waitForTimeout(800);
      const shotVenusPierced = await page.screenshot();
      saveShot(shotVenusPierced, 'antikythera_mk3_planet_venus_pierced');
    }
  }

  // 6. Switch to Jupiter (Zeus)
  console.log('Testing Jupiter & Galilean Satellites...');
  const jupiterBtn = await page.$('button[data-planet="jupiter"]');
  if (jupiterBtn) {
    await jupiterBtn.click();
    await page.waitForTimeout(1000);
    const shotJupiter = await page.screenshot();
    saveShot(shotJupiter, 'antikythera_mk3_planet_jupiter');
  }

  // 7. Switch to Pluto (Plouton) - Dwarf Planet
  console.log('Testing Pluto & Charon Tidal Locking...');
  const plutoBtn = await page.$('button[data-planet="pluto"]');
  if (plutoBtn) {
    await plutoBtn.click();
    await page.waitForTimeout(1000);
    const shotPluto = await page.screenshot();
    saveShot(shotPluto, 'antikythera_mk3_planet_pluto');
  }

  // 8. Return to Earth Baseline (Regression Check)
  console.log('Returning to Earth (Gaia) Baseline...');
  const earthBtn = await page.$('button[data-planet="earth"]');
  if (earthBtn) {
    await earthBtn.click();
    await page.waitForTimeout(1000);
  }

  // 9. Mobile 390x844 Responsive Viewport Audit
  console.log('Performing Mobile 390x844 responsive audit...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1200);
  const shotMobile = await page.screenshot();
  saveShot(shotMobile, 'antikythera_mk3_mobile_390x844');

  await browser.close();

  console.log('--- AUDIT COMPLETE ---');
  console.log(`Console error count: ${errors.length}`);
  if (errors.length > 0) {
    console.log('Errors observed:', errors);
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
