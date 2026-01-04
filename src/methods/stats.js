// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.stats("Collection")
import { readIndex } from "../../utils.js";

function log(...args) {
  console.log(`[MagnusDB][Stats]`, ...args);
}

export default async function collectionStats(collection) {
  try {
    const index = await readIndex(collection);
    const stats = {
      totalRecords: index?.totalRecords || 0,
      totalPages: index?.pages?.length || 0,
      recordsPerPage: index?.pages || [],
    };
    log(`Stats for "${collection}":`, stats);
    return stats;
  } catch (err) {
    console.error(`[MagnusDB][Stats][Error]`, err);
    return null;
  }
}
