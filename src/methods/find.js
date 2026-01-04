// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.find("Collection", filterFn)
import { get } from "./get.js";

function log(...args) {
  console.log(`[MagnusDB][Find]`, ...args);
}

export default async function findRecords(collection, filterFn) {
  try {
    const all = await get(collection);
    const results = all.filter(filterFn);
    log(`Found ${results.length} matching records in "${collection}"`);
    return results;
  } catch (err) {
    console.error(`[MagnusDB][Find][Error]`, err);
    return [];
  }
}
