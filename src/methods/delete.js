// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.delete("Collection:Position")
import { readIndex, writeIndex, readPage, writePage, getPageFile } from "../../utils.js";

// Centralized logger
function log(...args) {
  console.log(`[MagnusDB][Delete]`, ...args);
}

export default async function deleteRecord(collectionPosition) {
  if (!collectionPosition || typeof collectionPosition !== "string") return false;

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

    // Find the page containing the record
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

    // Delete the record
    const deletedRecord = pageRecords.splice(localPos, 1)[0];
    await writePage(pageFile, pageRecords);
    log(`Deleted record at global position ${position} (page ${pageNum}, local ${localPos})`);

    // Update index
    index.pages[pageNum] = pageRecords.length;
    index.totalRecords--;
    await writeIndex(collection, index);
    log(`Index updated. Total records now: ${index.totalRecords}`);

    return deletedRecord;

  } catch (err) {
    console.error(`[MagnusDB][Delete][Error] Failed to delete record from "${collection}":`, err);
    return false;
  }
}
