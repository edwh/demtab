// PIR Motion Sensor support for GPIO17 on Raspberry Pi 5
// Uses gpiod (libgpiod) instead of sysfs for Pi 5 compatibility

import { spawn } from 'child_process';

const GPIO_CHIP = '/dev/gpiochip0';
const GPIO_LINE = 17;
const MOTION_TIMEOUT_MS = 30000; // Keep motion state for 30 seconds after last detection

let motionDetected = false;
let motionTimeout = null;
let gpiomonProcess = null;
let lastMotionTime = null;
let pirAvailable = false;
let onMotionCallback = null;

function startGpioMonitor() {
  try {
    // Use gpiomon to watch for rising edges on GPIO17
    // gpiomon v2 syntax: gpiomon -c <chip> -e rising <line>
    gpiomonProcess = spawn('gpiomon', ['-c', GPIO_CHIP, '-e', 'rising', String(GPIO_LINE)]);

    gpiomonProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      console.log('PIR event:', output);

      // Any output from gpiomon means motion detected (rising edge)
      motionDetected = true;
      lastMotionTime = new Date();
      pirAvailable = true;

      // Call the motion callback if registered
      if (onMotionCallback) {
        onMotionCallback();
      }

      // Clear any existing timeout
      if (motionTimeout) {
        clearTimeout(motionTimeout);
      }

      // Set timeout to clear motion state after inactivity
      motionTimeout = setTimeout(() => {
        motionDetected = false;
        console.log('Motion timeout - no motion');
      }, MOTION_TIMEOUT_MS);
    });

    gpiomonProcess.stderr.on('data', (data) => {
      console.error('gpiomon error:', data.toString());
    });

    gpiomonProcess.on('error', (error) => {
      console.error('Failed to start gpiomon:', error.message);
      // Fall back to polling if gpiomon fails
      startPolling();
    });

    gpiomonProcess.on('close', (code) => {
      console.log('gpiomon exited with code:', code);
      gpiomonProcess = null;
      // Don't auto-restart - fall back to polling instead
      if (code !== 0) {
        console.log('gpiomon failed, falling back to polling');
        startPolling();
      }
    });

    console.log('PIR motion sensor initialized on GPIO17 using gpiomon');
  } catch (error) {
    console.error('Error starting GPIO monitor:', error.message);
    startPolling();
  }
}

// Fallback: poll GPIO state
let pollingInterval = null;
function startPolling() {
  console.log('Using GPIO polling fallback');

  pollingInterval = setInterval(async () => {
    try {
      const { execSync } = await import('child_process');
      const result = execSync(`gpioget ${GPIO_CHIP} ${GPIO_LINE}`, { encoding: 'utf-8' }).trim();

      // Check if GPIO is high (motion detected)
      const isHigh = result.includes('active') || result === '1';

      if (isHigh && !motionDetected) {
        console.log('Motion detected (polling)');
        motionDetected = true;

        if (motionTimeout) {
          clearTimeout(motionTimeout);
        }

        motionTimeout = setTimeout(() => {
          motionDetected = false;
          console.log('Motion timeout - no motion');
        }, MOTION_TIMEOUT_MS);
      }
    } catch (error) {
      // Silently ignore polling errors
    }
  }, 500);
}

// Start monitoring
startGpioMonitor();

// Get current motion state
export function isMotionDetected() {
  return motionDetected;
}

// Get last motion time
export function getLastMotionTime() {
  return lastMotionTime;
}

// Check if PIR sensor is available
export function isPirAvailable() {
  return pirAvailable;
}

// For testing/simulation - manually set motion state
export function setMotionDetected(state) {
  motionDetected = state;

  if (state && motionTimeout) {
    clearTimeout(motionTimeout);
    motionTimeout = setTimeout(() => {
      motionDetected = false;
    }, MOTION_TIMEOUT_MS);
  }

  // Also trigger callback when manually setting motion
  if (state && onMotionCallback) {
    onMotionCallback();
  }
}

// Register a callback for when motion is detected
export function onMotion(callback) {
  onMotionCallback = callback;
}

// Cleanup on exit
export function cleanup() {
  if (gpiomonProcess) {
    gpiomonProcess.kill();
  }
  if (motionTimeout) {
    clearTimeout(motionTimeout);
  }
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
