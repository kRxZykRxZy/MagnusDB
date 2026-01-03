import fs from "fs";
import path from "path";
import { dbPath } from "./config.js";
import { encode, decode } from "msgpack";

// Paths
export function getCollectionFolder(collection) {
  const folder = path.join(dbPath, "collections", collection);
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
  return folder;
}

export function getIndexFile(collection) {
  return path.join(getCollectionFolder(collection), "_index.json");
}

// Read/write index
export async function readIndex(collection) {
  const file = getIndexFile(collection);
  if (!fs.existsSync(file)) return { totalRecords: 0, pages: [] };
  return JSON.parse(await fs.promises.readFile(file, "utf-8"));
}

export async function writeIndex(collection, index) {
  const file = getIndexFile(collection);
  await fs.promises.writeFile(file, JSON.stringify(index, null, 2));
}

// Read/write page
export function getPageFile(collection, pageNum) {
  return path.join(getCollectionFolder(collection), `${pageNum.toString().padStart(5, '0')}.dat`);
}

export async function writePage(pageFile, records) {
  const buffer = encode(records);
  await fs.promises.writeFile(pageFile, buffer);
}

export async function readPage(pageFile) {
  if (!fs.existsSync(pageFile)) return [];
  const buffer = await fs.promises.readFile(pageFile);
  return decode(buffer);
}
