// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.insert(Collection, Record);
import { readIndex, writeIndex, getPageFile, readPage, writePage } from "../../utils.js";
import { options } from "../../config.js";
import { Worker } from "worker_threads";
import path from "path";

export default async function(collection, record) {
  let index = await readIndex(collection);

  // Determine last page
  let lastPageNum = index.pages.length ? index.pages.length - 1 : 0;
  let pageRecords = [];

  if (index.pages.length) {
    pageRecords = await readPage(getPageFile(collection, lastPageNum));
  }

  // If page full → new page
  if (pageRecords.length >= options.pageSize) {
    lastPageNum++;
    pageRecords = [];
  }

  pageRecords.push(record);

  // Multi-threaded write
  const pageFile = getPageFile(collection, lastPageNum);
  if (options.mode === "multi" && options.threads > 1) {
    const worker = new Worker(path.join(new URL('.', import.meta.url).pathname, "../../worker.js"), {
      workerData: { pageFile, records: pageRecords }
    });
    worker.on("error", console.error);
  } else {
    await writePage(pageFile, pageRecords);
  }

  // Update index
  if (!index.pages[lastPageNum]) index.pages[lastPageNum] = 0;
  index.pages[lastPageNum] = pageRecords.length;
  index.totalRecords = (index.totalRecords || 0) + 1;
  await writeIndex(collection, index);
};
