const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('Starting Antikythera Mk III automated browser audit & screenshot suite...');
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

  // Screenshot 1: Standing Sky Window (Default view with Inset & 3D mechanism)
  const shotSky = await page.screenshot();
  saveShot(shotSky, 'antikythera_mk3_standing_sky');

  // Test layout switch to SPLIT
  console.log('Testing Layout Switch: SPLIT 50/50...');
  const layoutSelect = await page.$('#layout-selector');
  if (layoutSelect) {
    await layoutSelect.selectOption('SPLIT');
    await page.waitForTimeout(1000);
    const shotSplit = await page.screenshot();
    saveShot(shotSplit, 'antikythera_mk3_split_screen');
  }

  // Test Precession Pole view toggle
  console.log('Testing Precession Pole View...');
  const poleCheck = await page.$('#check-precession-pole');
  if (poleCheck) {
    await poleCheck.check();
    await page.waitForTimeout(1000);
    const shotPole = await page.screenshot();
    saveShot(shotPole, 'antikythera_mk3_precession_pole');
  }

  // Return to Inset mode for tab audits
  if (layoutSelect) {
    await layoutSelect.selectOption('INSET');
    await page.waitForTimeout(500);
  }

  // Screenshot 3: Compute Bay
  console.log('Testing Compute Bay Tab...');
  const computeTab = await page.$('button[data-tab="compute"]');
  if (computeTab) {
    await computeTab.click();
    await page.waitForTimeout(800);
    const runComputeBtn = await page.$('#btn-run-compute');
    if (runComputeBtn) await runComputeBtn.click();
    await page.waitForTimeout(500);
    const shotCompute = await page.screenshot();
    saveShot(shotCompute, 'antikythera_mk3_compute_bay');
  }

  // Screenshot 4: Bayesian Inverse Dating
  console.log('Testing Inverse Dating Tab...');
  const inverseTab = await page.$('button[data-tab="inverse"]');
  if (inverseTab) {
    await inverseTab.click();
    await page.waitForTimeout(800);
    const shotInverse = await page.screenshot();
    saveShot(shotInverse, 'antikythera_mk3_bayesian_dating');
  }

  // Screenshot 5: Ancient Reconciliation
  console.log('Testing Reconciliation Tab...');
  const recTab = await page.$('button[data-tab="reconciliation"]');
  if (recTab) {
    await recTab.click();
    await page.waitForTimeout(800);
    const shotRec = await page.screenshot();
    saveShot(shotRec, 'antikythera_mk3_reconciliation');
  }

  // Screenshot 6: Life of Object
  console.log('Testing Life of Object Tab...');
  const lifeTab = await page.$('button[data-tab="life"]');
  if (lifeTab) {
    await lifeTab.click();
    await page.waitForTimeout(800);
    const shotLife = await page.screenshot();
    saveShot(shotLife, 'antikythera_mk3_life_timeline');
  }

  // Test Time Engine step buttons
  console.log('Testing Time Engine step buttons...');
  const forwardYearBtn = await page.$('#btn-step-forward-year');
  if (forwardYearBtn) {
    await forwardYearBtn.click();
    await page.waitForTimeout(300);
  }

  // Screenshot 7: Mobile 390x844 Viewport Audit
  console.log('Performing Mobile 390x844 responsive audit...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
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
