// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.import(pathToFile);
import fs from "fs";
import path from "path";
import { dbPath, options } from "../../config.js";
import { getCollectionFolder, writePage, writeIndex } from "../../utils.js";
import { decode } from "@msgpack/msgpack";

export default async function(importPath) {
  if (!fs.existsSync(importPath)) throw new Error("Import file not found.");

  const startTime = Date.now();
  const buffer = await fs.promises.readFile(importPath);
  const importData = decode(buffer);

  const collections = Object.keys(importData);
  let totalRecords = 0;

  for (const collection of collections) {
    const collectionData = importData[collection];
    const index = collectionData.index;
    const pages = collectionData.pages;

    const folder = getCollectionFolder(collection);

    // Write all pages
    for (let i = 0; i < pages.length; i++) {
      await writePage(path.join(folder, `${i.toString().padStart(5, "0")}.dat`), pages[i]);
      totalRecords += pages[i].length;
    }

    // Write index
    await writeIndex(collection, index);
  }

  const approxSizeMB = Buffer.byteLength(JSON.stringify(importData)) / 1024 / 1024;
  const approxTimeSec = (approxSizeMB / 50).toFixed(2);

  console.log(`Importing ${totalRecords} records (~${approxSizeMB.toFixed(2)} MB)`);
  console.log(`Estimated time: ~${approxTimeSec} seconds`);
  console.log(`Import complete! Finished in ${(Date.now() - startTime) / 1000}s`);
};
