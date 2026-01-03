// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.export(pathToFile);
import fs from "fs";
import path from "path";
import { dbPath } from "../../config.js";
import { readPage, readIndex, getCollectionFolder } from "../../utils.js";
import { encode } from "@msgpack/msgpack";

export default async function(exportPath) {
  const startTime = Date.now();
  const collectionsDir = path.join(dbPath, "collections");
  if (!fs.existsSync(collectionsDir)) throw new Error("No collections found.");

  const collections = fs.readdirSync(collectionsDir);
  const exportData = {};

  let totalRecords = 0;

  for (const collection of collections) {
    const collectionFolder = getCollectionFolder(collection);
    const index = await readIndex(collection);
    const pagesData = [];

    for (let i = 0; i < index.pages.length; i++) {
      const page = await readPage(path.join(collectionFolder, `${i.toString().padStart(5, "0")}.dat`));
      pagesData.push(page);
      totalRecords += page.length;
    }

    exportData[collection] = {
      index,
      pages: pagesData
    };
  }

  // Estimate time (rough): assume 50 MB/s write speed
  const approxSizeMB = Buffer.byteLength(JSON.stringify(exportData)) / 1024 / 1024;
  const approxTimeSec = (approxSizeMB / 50).toFixed(2);

  console.log(`Exporting ${totalRecords} records (~${approxSizeMB.toFixed(2)} MB)`);
  console.log(`Estimated time: ~${approxTimeSec} seconds`);

  const buffer = encode(exportData);
  await fs.promises.writeFile(exportPath, buffer);

  console.log(`Export complete! Saved to ${exportPath} in ${(Date.now() - startTime) / 1000}s`);
};
