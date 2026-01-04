// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.get("Collection:Position")
import { readIndex, readPage, getPageFile } from "../../utils.js";

// Centralized logger
function log(...args) {
  console.log(`[MagnusDB][Get]`, ...args);
}

export default async function getRecord(collectionPosition) {
  if (!collectionPosition || typeof collectionPosition !== "string") return null;

  const [collection, posStr] = collectionPosition.split(":");
  const position = posStr !== undefined ? parseInt(posStr) : undefined;

  try {
    // Fetch all records if position not provided
    if (position === undefined || isNaN(position)) {
      log(`Fetching all records from collection "${collection}"`);
      const index = await readIndex(collection);
      const allRecords = [];

      for (let i = 0; i < index.pages.length; i++) {
        const page = await readPage(getPageFile(collection, i));
        allRecords.push(...page);
        if (i % 10 === 0) log(`Fetched page ${i} (${page.length} records)`);
      }

      log(`Fetched all records. Total: ${allRecords.length}`);
      return allRecords;
    } else {
      log(`Fetching record at position ${position} from "${collection}"`);
      // Delegate to fetch module (safe and consistent)
      const fetchModule = await import("./fetch.js");
      return await fetchModule.default(`${collection}:${position}`);
    }
  } catch (err) {
    console.error(`[MagnusDB][Get][Error] Failed to get record(s) from "${collection}":`, err);
    return null;
  }
}
