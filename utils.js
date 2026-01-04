import fs from "fs";
import path from "path";
import { dbPath } from "./config.js";
import { encode, decode } from "msgpack";

// --- Paths ---
export function getCollectionFolder(collection) {
  const folder = path.join(dbPath, "collections", collection);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  return folder;
}

export function getIndexFile(collection) {
  return path.join(getCollectionFolder(collection), "_index.json");
}

export function getPageFile(collection, pageNum) {
  return path.join(getCollectionFolder(collection), `${pageNum.toString().padStart(5, '0')}.dat`);
}

// --- Read/write index ---
export async function readIndex(collection) {
  const file = getIndexFile(collection);
  if (!fs.existsSync(file)) return { totalRecords: 0, pages: [] };
  return JSON.parse(await fs.promises.readFile(file, "utf-8"));
}

export async function writeIndex(collection, index) {
  const file = getIndexFile(collection);
  await fs.promises.writeFile(file, JSON.stringify(index, null, 2));
}

// --- Read/write page ---
export async function writePage(pageFile, records) {
  const buffer = encode(records);
  await fs.promises.writeFile(pageFile, buffer);
}

export async function readPage(pageFile) {
  if (!fs.existsSync(pageFile)) return [];
  const buffer = await fs.promises.readFile(pageFile);
  return decode(buffer);
}

// List all collections
export function listCollections() {
  const collectionsDir = path.join(dbPath, "collections");
  if (!fs.existsSync(collectionsDir)) return [];
  return fs.readdirSync(collectionsDir).filter(f => fs.statSync(path.join(collectionsDir, f)).isDirectory());
}

// Delete a collection entirely
export async function deleteCollection(collection) {
  const folder = getCollectionFolder(collection);
  if (fs.existsSync(folder)) {
    fs.rmSync(folder, { recursive: true, force: true });
  }
}

// Check if a collection exists
export function collectionExists(collection) {
  return fs.existsSync(getCollectionFolder(collection));
}

// Delete a specific page
export async function deletePage(collection, pageNum) {
  const pageFile = getPageFile(collection, pageNum);
  if (fs.existsSync(pageFile)) fs.unlinkSync(pageFile);
}

// Utility to read all records in a collection (merge pages)
export async function readAllRecords(collection) {
  const index = await readIndex(collection);
  const allRecords = [];
  for (const pageNum of index.pages) {
    const pageFile = getPageFile(collection, pageNum);
    const records = await readPage(pageFile);
    allRecords.push(...records);
  }
  return allRecords;
}

// Utility to write full collection at once
export async function writeAllRecords(collection, records, pageSize = 1000) {
  const folder = getCollectionFolder(collection);

  // Split into pages
  const pages = [];
  for (let i = 0; i < records.length; i += pageSize) {
    const pageRecords = records.slice(i, i + pageSize);
    const pageNum = pages.length;
    const pageFile = getPageFile(collection, pageNum);
    await writePage(pageFile, pageRecords);
    pages.push(pageNum);
  }

  // Update index
  await writeIndex(collection, { totalRecords: records.length, pages });
}

// Generate a new auto-increment ID for a collection
export async function getNextId(collection) {
  const index = await readIndex(collection);
  return index.totalRecords + 1;
}

// Merge multiple collections into one
export async function mergeCollections(targetCollection, sourceCollections = []) {
  const mergedRecords = [];
  for (const col of sourceCollections) {
    const records = await readAllRecords(col);
    mergedRecords.push(...records);
  }
  await writeAllRecords(targetCollection, mergedRecords);
}

// Backup a collection
export async function backupCollection(collection, backupFolder) {
  const folder = getCollectionFolder(collection);
  const dest = path.join(backupFolder, collection);
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(folder, dest, { recursive: true });
}

// Restore a collection from backup
export async function restoreCollection(collection, backupFolder) {
  const src = path.join(backupFolder, collection);
  const dest = getCollectionFolder(collection);
  if (!fs.existsSync(src)) throw new Error("Backup not found");
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
}
