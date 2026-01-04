// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

import fs from "fs";
import path from "path";

const db = {};
const methodsDir = path.join(new URL('.', import.meta.url).pathname, "methods");

function log(...args) {
  console.log(`[MagnusDB][Loader]`, ...args);
}

// Initialize db once
let initPromise;

export async function getDB() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!fs.existsSync(methodsDir)) {
        throw new Error("Methods directory not found: " + methodsDir);
      }

      const files = fs.readdirSync(methodsDir).filter(f => f.endsWith(".js"));
      if (!files.length) log("No method files found in methods folder");

      for (const file of files) {
        try {
          const modulePath = path.join(methodsDir, file);
          const mod = await import(modulePath);
          const name = path.basename(file, ".js");
          db[name] = mod.default;
          log(`Loaded method: "${name}"`);
        } catch (err) {
          console.error(`[MagnusDB][Loader][Error] Failed to load "${file}":`, err);
        }
      }

      log(`Total methods loaded: ${Object.keys(db).length}`);
      return db;
    } catch (err) {
      console.error(`[MagnusDB][Loader][Error]`, err);
      return db;
    }
  })();

  return initPromise;
}
