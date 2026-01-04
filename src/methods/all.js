// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.all("Collection")
import getRecord from "./get.js";

// Centralized logger
function log(...args) {
  console.log(`[MagnusDB][All]`, ...args);
}

export default async function allRecords(collection) {
  if (!collection || typeof collection !== "string") {
    log(`Invalid collection name: "${collection}"`);
    return [];
  }

  try {
    log(`Fetching all records from collection "${collection}"`);
    const records = await getRecord(collection); // getRecord handles fetching all if no position
    log(`Fetched ${records?.length || 0} records from "${collection}"`);
    return records || [];
  } catch (err) {
    console.error(`[MagnusDB][All][Error] Failed to fetch all records from "${collection}":`, err);
    return [];
  }
}
