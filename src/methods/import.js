// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.import(pathToFile);
import fs from "fs";
import path from "path";
import { dbPath, options } from "../../config.js";
import { getCollectionFolder, writePage, writeIndex } from "../../utils.js";
import { decode } from "@msgpack/msgpack";

// Centralized logger
function log(...args) {
  console.log(`[MagnusDB][Import]`, ...args);
}

export default async function importDB(importPath) {
  if (!fs.existsSync(importPath)) throw new Error("Import file not found.");

  const startTime = Date.now();
  log(`Starting import from: ${importPath}`);

  // Read and decode the import file
  let importData;
  try {
    const buffer = await fs.promises.readFile(importPath);
    importData = decode(buffer);
    log(`Import file decoded successfully`);
  } catch (err) {
    console.error(`[MagnusDB][Import][Error] Failed to read/decode file:`, err);
    throw err;
  }

  const collections = Object.keys(importData);
  let totalRecords = 0;

  for (const collection of collections) {
    try {
      const collectionData = importData[collection];
      const index = collectionData.index || { totalRecords: 0, pages: [] };
      const pages = collectionData.pages || [];

      const folder = getCollectionFolder(collection);
      log(`Importing collection: "${collection}" with ${pages.length} pages`);

      // Write all pages
      for (let i = 0; i < pages.length; i++) {
        const pageFile = path.join(folder, `${i.toString().padStart(5, "0")}.dat`);
        await writePage(pageFile, pages[i]);
        totalRecords += pages[i].length;
        if (i % 10 === 0) log(`Written page ${i} for collection "${collection}"`);
      }

      // Write index
      await writeIndex(collection, index);
      log(`Collection "${collection}" imported successfully`);

    } catch (err) {
      console.error(`[MagnusDB][Import][Error] Failed to import collection "${collection}":`, err);
    }
  }

  const approxSizeMB = Buffer.byteLength(JSON.stringify(importData)) / 1024 / 1024;
  const approxTimeSec = (approxSizeMB / 50).toFixed(2); // rough estimate

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
  log(`Import complete!`);
  log(`Total records imported: ${totalRecords}`);
  log(`Approximate size: ${approxSizeMB.toFixed(2)} MB`);
  log(`Estimated time based on size: ~${approxTimeSec} seconds`);
  log(`Actual time taken: ${elapsedSec} seconds`);
}
