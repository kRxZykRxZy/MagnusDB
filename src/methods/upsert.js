// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.upsert(collection, record, idField)
import insert from "./insert.js";
import update from "./update.js";
import { get } from "./get.js";

function log(...args) {
  console.log(`[MagnusDB][Upsert]`, ...args);
}

export default async function upsertRecord(collection, record, idField = "id") {
  if (!record || typeof record !== "object") return false;

  try {
    const all = await get(collection);
    const existingIndex = all.findIndex(r => r[idField] === record[idField]);

    if (existingIndex >= 0) {
      log(`Updating existing record with ${idField}=${record[idField]}`);
      return await update(`${collection}:${existingIndex}`, record);
    } else {
      log(`Inserting new record with ${idField}=${record[idField]}`);
      return await insert(collection, record);
    }
  } catch (err) {
    console.error(`[MagnusDB][Upsert][Error]`, err);
    return false;
  }
}
