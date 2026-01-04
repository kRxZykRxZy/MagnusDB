// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.export(pathToFile)
import fs from "fs";
import path from "path";
import { dbPath } from "../../config.js";
import { readPage, readIndex, getCollectionFolder } from "../../utils.js";
import { encode } from "@msgpack/msgpack";

// Centralized logger
function log(...args) {
  console.log(`[MagnusDB][Export]`, ...args);
}

export default async function exportDB(exportPath) {
  const startTime = Date.now();

  try {
    const collectionsDir = path.join(dbPath, "collections");
    if (!fs.existsSync(collectionsDir)) throw new Error("No collections found.");

    const collections = fs.readdirSync(collectionsDir);
    if (!collections.length) throw new Error("No collections to export.");

    log(`Starting export for ${collections.length} collections`);

    const exportData = {};
    let totalRecords = 0;

    for (const collection of collections) {
      try {
        const collectionFolder = getCollectionFolder(collection);
        const index = await readIndex(collection);
        const pagesData = [];

        for (let i = 0; i < (index.pages?.length || 0); i++) {
          const pageFile = path.join(collectionFolder, `${i.toString().padStart(5, "0")}.dat`);
          const page = await readPage(pageFile);
          pagesData.push(page);
          totalRecords += page.length;

          if (i % 10 === 0) log(`Read page ${i} for collection "${collection}" (${page.length} records)`);
        }

        exportData[collection] = { index, pages: pagesData };
        log(`Collection "${collection}" ready for export`);
      } catch (err) {
        console.error(`[MagnusDB][Export][Error] Failed to process collection "${collection}":`, err);
      }
    }

    const approxSizeMB = Buffer.byteLength(JSON.stringify(exportData)) / 1024 / 1024;
    const approxTimeSec = (approxSizeMB / 50).toFixed(2); // rough estimate
    log(`Exporting ${totalRecords} records (~${approxSizeMB.toFixed(2)} MB)`);
    log(`Estimated time: ~${approxTimeSec} seconds`);

    const buffer = encode(exportData);
    await fs.promises.writeFile(exportPath, buffer);

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`Export complete! Saved to "${exportPath}" in ${elapsedSec} seconds`);

  } catch (err) {
    console.error(`[MagnusDB][Export][Error] Failed to export database:`, err);
    throw err;
  }
}
