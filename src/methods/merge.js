// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.merge(targetCollection, [sourceCollections])
import { readPage, writePage, writeIndex, getPageFile, readIndex } from "../../utils.js";

function log(...args) {
  console.log(`[MagnusDB][Merge]`, ...args);
}

export default async function mergeCollections(target, sources = []) {
  try {
    let allRecords = [];

    for (const source of sources) {
      const index = await readIndex(source);
      for (let i = 0; i < index.pages.length; i++) {
        const page = await readPage(getPageFile(source, i));
        allRecords.push(...page);
      }
      log(`Collected ${index.totalRecords} records from "${source}"`);
    }

    // Write all records to target collection
    const pageSize = 1000;
    const pages = [];
    for (let i = 0; i < allRecords.length; i += pageSize) {
      const pageNum = pages.length;
      const pageRecords = allRecords.slice(i, i + pageSize);
      await writePage(getPageFile(target, pageNum), pageRecords);
      pages.push(pageNum);
    }

    await writeIndex(target, { totalRecords: allRecords.length, pages });
    log(`Merged ${allRecords.length} records into "${target}"`);
    return true;
  } catch (err) {
    console.error(`[MagnusDB][Merge][Error]`, err);
    return false;
  }
}
