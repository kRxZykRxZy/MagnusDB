// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.fetch("Collection:Position")
import { readIndex, readPage, getPageFile } from "../../utils.js";

// Centralized logger
function log(...args) {
  console.log(`[MagnusDB][Fetch]`, ...args);
}

export default async function fetchRecord(collectionPosition) {
  if (!collectionPosition || typeof collectionPosition !== "string") return null;

  const [collection, posStr] = collectionPosition.split(":");
  const position = parseInt(posStr);

  if (isNaN(position)) {
    log(`Invalid position: "${posStr}"`);
    return null;
  }

  try {
    const index = await readIndex(collection);

    if (!index.pages.length) {
      log(`Collection "${collection}" is empty`);
      return null;
    }

    if (position >= index.totalRecords) {
      log(`Position ${position} exceeds total records (${index.totalRecords}) in "${collection}"`);
      return null;
    }

    // Find which page contains the record
    let acc = 0;
    let pageNum = 0;
    for (; pageNum < index.pages.length; pageNum++) {
      if (position < acc + index.pages[pageNum]) break;
      acc += index.pages[pageNum];
    }

    const localPos = position - acc;
    const pageFile = getPageFile(collection, pageNum);
    const pageRecords = await readPage(pageFile);

    if (!pageRecords || localPos >= pageRecords.length) {
      log(`Record not found at local position ${localPos} in page ${pageNum}`);
      return null;
    }

    log(`Fetched record at global position ${position} (page ${pageNum}, local ${localPos})`);
    return pageRecords[localPos];

  } catch (err) {
    console.error(`[MagnusDB][Fetch][Error] Failed to fetch record from "${collection}":`, err);
    return null;
  }
}
