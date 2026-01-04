// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.truncate("Collection")
import { getCollectionFolder, writePage, writeIndex } from "../../utils.js";

function log(...args) {
  console.log(`[MagnusDB][Truncate]`, ...args);
}

export default async function truncateCollection(collection) {
  try {
    const folder = getCollectionFolder(collection);
    const index = { totalRecords: 0, pages: [] };

    // Overwrite all pages with empty arrays
    for (let i = 0; i < (index.pages?.length || 0); i++) {
      await writePage(`${folder}/${i.toString().padStart(5, "0")}.dat`, []);
    }

    await writeIndex(collection, index);
    log(`Collection "${collection}" truncated successfully`);
    return true;
  } catch (err) {
    console.error(`[MagnusDB][Truncate][Error]`, err);
    return false;
  }
}
