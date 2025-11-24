// Screen/Backlight control for Pi Touch Display 2
// Controls backlight via /sys/class/backlight/

import { writeFileSync, readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

const BACKLIGHT_BASE = '/sys/class/backlight';
let backlightPath = null;
let maxBrightness = 31;
let savedBrightness = 31;

// Find the backlight device
function findBacklightDevice() {
  try {
    if (!existsSync(BACKLIGHT_BASE)) {
      console.log('No backlight control available');
      return null;
    }

    const devices = readdirSync(BACKLIGHT_BASE);
    if (devices.length === 0) {
      console.log('No backlight devices found');
      return null;
    }

    // Use the first backlight device found
    const device = devices[0];
    const path = join(BACKLIGHT_BASE, device);

    // Read max brightness
    const maxPath = join(path, 'max_brightness');
    if (existsSync(maxPath)) {
      maxBrightness = parseInt(readFileSync(maxPath, 'utf-8').trim());
    }

    console.log(`Found backlight device: ${device} (max brightness: ${maxBrightness})`);
    return path;
  } catch (error) {
    console.error('Error finding backlight device:', error.message);
    return null;
  }
}

// Initialize
backlightPath = findBacklightDevice();

// Get current brightness
export function getBrightness() {
  if (!backlightPath) return maxBrightness;

  try {
    const brightnessPath = join(backlightPath, 'brightness');
    return parseInt(readFileSync(brightnessPath, 'utf-8').trim());
  } catch (error) {
    console.error('Error reading brightness:', error.message);
    return maxBrightness;
  }
}

// Set brightness (0 = off, maxBrightness = full)
export function setBrightness(value) {
  if (!backlightPath) {
    console.log('Backlight control not available');
    return false;
  }

  try {
    const brightnessPath = join(backlightPath, 'brightness');
    const clampedValue = Math.max(0, Math.min(maxBrightness, value));
    writeFileSync(brightnessPath, String(clampedValue));
    console.log(`Set brightness to ${clampedValue}`);
    return true;
  } catch (error) {
    console.error('Error setting brightness:', error.message);
    return false;
  }
}

// Turn screen off (save current brightness and set to 0)
export function screenOff() {
  savedBrightness = getBrightness();
  if (savedBrightness === 0) savedBrightness = maxBrightness; // Don't save 0
  return setBrightness(0);
}

// Turn screen on (restore saved brightness)
export function screenOn() {
  return setBrightness(savedBrightness || maxBrightness);
}

// Check if screen is currently off
export function isScreenOff() {
  return getBrightness() === 0;
}

// Get max brightness value
export function getMaxBrightness() {
  return maxBrightness;
}
