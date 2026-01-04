// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.restore("Collection", backupFolder)
import fs from "fs";
import path from "path";
import { getCollectionFolder } from "../../utils.js";

function log(...args) {
  console.log(`[MagnusDB][Restore]`, ...args);
}

export default async function restoreCollection(collection, backupFolder) {
  try {
    const src = path.join(backupFolder, collection);
    const dest = getCollectionFolder(collection);
    if (!fs.existsSync(src)) throw new Error("Backup not found");

    if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(src, dest, { recursive: true });
    log(`Collection "${collection}" restored from "${src}"`);
    return true;
  } catch (err) {
    console.error(`[MagnusDB][Restore][Error]`, err);
    return false;
  }
}
