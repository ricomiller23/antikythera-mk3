import './style.css';
import { AntikytheraKinematicsEngineMk3 } from './kinematics/gearGraphMk3.ts';
import { AntikytheraSceneMk3 } from './scene/AntikytheraSceneMk3.ts';
import { SkyWindow } from './sky/skyWindow.ts';
import { AntiqueBronzeGongSynthesizer } from './audio/gongAudio.ts';
import { AntikytheraDashboardMk3 } from './ui/DashboardMk3.ts';
import { timeEngine } from './time/timeEngine.ts';
import { siteManager } from './site/siteManager.ts';
import { HighPrecisionSkyEngine } from './sky/skyEngine.ts';

window.addEventListener('DOMContentLoaded', () => {
  const mechViewport = document.getElementById('viewport-mechanism') as HTMLElement;
  const skyViewport = document.getElementById('viewport-sky') as HTMLElement;
  const dashboardContainer = document.getElementById('dashboard-container') as HTMLElement;

  if (!mechViewport || !skyViewport || !dashboardContainer) {
    console.error('Core container DOM elements missing');
    return;
  }

  // 1. Initialize Kinematics Engine
  const kinematics = new AntikytheraKinematicsEngineMk3();

  // 2. Initialize 3D Scene (Mechanism)
  const scene = new AntikytheraSceneMk3(mechViewport, kinematics);

  // 3. Initialize Sky Window
  const skyWindow = new SkyWindow(skyViewport);

  // 4. Initialize Acoustic Synthesizer
  const gong = new AntiqueBronzeGongSynthesizer();

  // 5. Initialize Reactive Dashboard
  const dashboard = new AntikytheraDashboardMk3(
    dashboardContainer,
    kinematics,
    scene,
    skyWindow,
    gong
  );

  // 6. Animation / Simulation Render Loop
  let lastTime = performance.now();

  function animate(now: number) {
    const deltaSec = (now - lastTime) / 1000.0;
    lastTime = now;

    // Advance automated playback if active
    dashboard.updateAnimation(deltaSec);

    const timeState = timeEngine.getState();
    const currentSite = siteManager.getCurrentSite();

    // Compute mechanical kinematics
    const state = kinematics.computeKinematics(timeState.machineJD);

    // Update 3D mechanism
    scene.update(state, (timeState.machineJD - 1646000) / 365.25);
    scene.render();

    // Compute sky bodies for the current site and sky time
    const skyBodies = HighPrecisionSkyEngine.computeAllSkyBodies(timeState.skyJD, currentSite.latitude, currentSite.longitude);

    const mechPredictions: Record<string, { lon: number; lat: number }> = {
      sun: { lon: state.sunLongitudeDeg, lat: 0 },
      moon: { lon: state.moonLongitudeDeg, lat: state.moonLatitude },
      mercury: { lon: (state.sunLongitudeDeg + 20) % 360, lat: 2 },
      venus: { lon: (state.sunLongitudeDeg + 45) % 360, lat: 3 },
      mars: { lon: (state.sunLongitudeDeg + 60) % 360, lat: 1.5 },
      jupiter: { lon: (state.sunLongitudeDeg + 120) % 360, lat: 1.2 },
      saturn: { lon: (state.sunLongitudeDeg + 210) % 360, lat: 2.3 }
    };

    // Update Standing Sky Window
    skyWindow.updateSky(timeState, currentSite, skyBodies, mechPredictions);
    skyWindow.render();

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  // Resize handler
  window.addEventListener('resize', () => {
    scene.onResize();
    skyWindow.onResize();
  });
});
