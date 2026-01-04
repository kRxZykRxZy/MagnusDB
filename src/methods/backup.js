// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.backup("Collection", backupFolder)
import { getCollectionFolder } from "../../utils.js";
import fs from "fs";
import path from "path";

function log(...args) {
  console.log(`[MagnusDB][Backup]`, ...args);
}

export default async function backupCollection(collection, backupFolder) {
  try {
    const src = getCollectionFolder(collection);
    const dest = path.join(backupFolder, collection);
    if (!fs.existsSync(backupFolder)) fs.mkdirSync(backupFolder, { recursive: true });
    fs.cpSync(src, dest, { recursive: true });
    log(`Collection "${collection}" backed up to "${dest}"`);
    return true;
  } catch (err) {
    console.error(`[MagnusDB][Backup][Error]`, err);
    return false;
  }
}
