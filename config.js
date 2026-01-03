import fs from "fs";
import path from "path";
import os from "os";

// Default DB config
export let dbPath = "./db";

// Options:
// - mode: "single" | "multi"
// - threads: number of worker threads
// - dynamicThreadScaling: true/false
// - pageSize: bytes per page (for large collections)
export let options = {
  mode: "single",
  threads: 1,
  dynamicThreadScaling: false,
  pageSize: 1024 * 1024 * 8 // 8 MB default
};

// Internal tracking
let currentThreads = options.threads;
let maxThreads = options.threads;

// Interval for dynamic scaling (ms)
let scalingInterval = null;

/**
 * Configure MagnusDB
 * @param {string} folderPath - DB folder path
 * @param {object} opts - user options
 */
export function config(folderPath, opts = {}) {
  dbPath = folderPath;

  // Merge options
  options = { ...options, ...opts };
  maxThreads = options.threads;
  currentThreads = maxThreads;

  // Ensure DB folder exists
  if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

  const collectionsPath = path.join(dbPath, "collections");
  if (!fs.existsSync(collectionsPath)) fs.mkdirSync(collectionsPath, { recursive: true });

  // Start dynamic thread scaling if enabled
  if (options.dynamicThreadScaling) {
    startDynamicThreadScaling();
  } else {
    stopDynamicThreadScaling();
  }
}

/**
 * Compute current optimal threads based on CPU usage
 */
export function getDynamicThreads() {
  if (!options.dynamicThreadScaling) return currentThreads;

  const cores = os.cpus().length;
  const load = os.loadavg()[0]; // 1-min load average
  const cpuPercent = (load / cores) * 100;

  if (cpuPercent >= 90) {
    currentThreads = 1; // throttle
  } else if (currentThreads < maxThreads) {
    currentThreads++; // gradually restore
  }

  return currentThreads;
}

/**
 * Start interval to auto-scale threads periodically
 */
function startDynamicThreadScaling() {
  if (scalingInterval) clearInterval(scalingInterval);

  scalingInterval = setInterval(() => {
    const cores = os.cpus().length;
    const load = (os.loadavg()[0] / cores) * 100;

    if (load >= 90) currentThreads = 1;
    else if (currentThreads < maxThreads) currentThreads++;

 
    // Optional: log for debugging
    // console.log(`[MagnusDB] CPU load: ${load.toFixed(1)}%, threads: ${currentThreads}`);
  }, 1000); // adjust every second
}

/**
 * Stop dynamic scaling interval
 */
function stopDynamicThreadScaling() {
  if (scalingInterval) {
    clearInterval(scalingInterval);
    scalingInterval = null;
  }
}
