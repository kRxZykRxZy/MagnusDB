// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.update("Collection:Position", newData)
import { readIndex, readPage, writePage, writeIndex, getPageFile } from "../../utils.js";

// Centralized logger
function log(...args) {
  console.log(`[MagnusDB][Update]`, ...args);
}

export default async function updateRecord(collectionPosition, newData) {
  if (!collectionPosition || typeof collectionPosition !== "string") return false;
  if (!newData || typeof newData !== "object") return false;

  const [collection, posStr] = collectionPosition.split(":");
  const position = parseInt(posStr);

  if (isNaN(position)) {
    log(`Invalid position: "${posStr}"`);
    return false;
  }

  try {
    const index = await readIndex(collection);
    if (!index.pages.length || position >= index.totalRecords) {
      log(`Position ${position} out of range for collection "${collection}"`);
      return false;
    }

    // Locate page
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
      return false;
    }

    const oldRecord = pageRecords[localPos];
    pageRecords[localPos] = { ...oldRecord, ...newData };

    await writePage(pageFile, pageRecords);
    log(`Updated record at global position ${position} (page ${pageNum}, local ${localPos})`);

    return pageRecords[localPos];

  } catch (err) {
    console.error(`[MagnusDB][Update][Error] Failed to update record in "${collection}":`, err);
    return false;
  }
}
