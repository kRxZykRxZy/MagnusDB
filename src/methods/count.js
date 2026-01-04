// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.count("Collection")
import { readIndex } from "../../utils.js";

function log(...args) {
  console.log(`[MagnusDB][Count]`, ...args);
}

export default async function countRecords(collection) {
  try {
    const index = await readIndex(collection);
    const count = index?.totalRecords || 0;
    log(`Collection "${collection}" has ${count} records`);
    return count;
  } catch (err) {
    console.error(`[MagnusDB][Count][Error]`, err);
    return 0;
  }
}
