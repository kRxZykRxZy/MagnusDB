// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.exists("Collection:Position")
import fetch from "./fetch.js";

function log(...args) {
  console.log(`[MagnusDB][Exists]`, ...args);
}

export default async function exists(collectionPosition) {
  try {
    const rec = await fetch(collectionPosition);
    return !!rec;
  } catch (err) {
    console.error(`[MagnusDB][Exists][Error]`, err);
    return false;
  }
}
