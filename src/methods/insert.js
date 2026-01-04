// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.insert(collection, record)
import { readIndex, writeIndex, getPageFile, readPage, writePage } from "../../utils.js";
import { options } from "../../config.js";
import { Worker } from "worker_threads";
import path from "path";

// Centralized logger
function log(...args) {
  console.log(`[MagnusDB][Insert]`, ...args);
}

// Insert a record into a collection
export default async function insertRecord(collection, record) {
  try {
    log(`Starting insert into collection: "${collection}"`);

    // Load or initialize index
    let index = await readIndex(collection);
    if (!index.pages) index.pages = [];
    index.totalRecords ||= 0;

    // Determine last page
    let lastPageNum = index.pages.length ? index.pages.length - 1 : 0;
    let pageRecords = [];

    if (index.pages.length) {
      pageRecords = await readPage(getPageFile(collection, lastPageNum));
      log(`Loaded page ${lastPageNum} with ${pageRecords.length} records`);
    }

    // If page full → create new page
    if (pageRecords.length >= options.pageSize) {
      lastPageNum++;
      pageRecords = [];
      log(`Page full, creating new page ${lastPageNum}`);
    }

    // Append record
    pageRecords.push(record);
    log(`Appending record. Page ${lastPageNum} now has ${pageRecords.length} records`);

    const pageFile = getPageFile(collection, lastPageNum);

    // Write page (multi-threaded if enabled)
    if (options.mode === "multi" && options.threads > 1) {
      log(`Writing page ${lastPageNum} in worker thread`);
      const workerPath = path.join(new URL('.', import.meta.url).pathname, "../../worker.js");
      const worker = new Worker(workerPath, {
        workerData: { pageFile, records: pageRecords }
      });

      worker.on("error", (err) => log(`Worker error:`, err));
      worker.on("exit", (code) => {
        if (code !== 0) log(`Worker stopped with exit code ${code}`);
        else log(`Worker finished writing page ${lastPageNum}`);
      });

    } else {
      log(`Writing page ${lastPageNum} in main thread`);
      await writePage(pageFile, pageRecords);
      log(`Page ${lastPageNum} written successfully`);
    }

    // Update index
    index.pages[lastPageNum] = pageRecords.length;
    index.totalRecords++;
    await writeIndex(collection, index);
    log(`Index updated. Total records: ${index.totalRecords}`);

  } catch (err) {
    console.error(`[MagnusDB][Insert][Error] Failed to insert record into "${collection}":`, err);
    throw err; // rethrow so caller knows
  }
}
