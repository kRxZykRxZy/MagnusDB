// Object.fetch("Collection:Position");
import { readIndex, readPage, getPageFile } from "../../utils.js";

export default async function(collectionPosition) {
  const [collection, posStr] = collectionPosition.split(":");
  const position = parseInt(posStr);
  if (isNaN(position)) return null;

  const index = await readIndex(collection);
  if (!index.pages.length || position >= index.totalRecords) return null;

  // Find which page
  let acc = 0;
  let pageNum = 0;
  for (; pageNum < index.pages.length; pageNum++) {
    if (position < acc + index.pages[pageNum]) break;
    acc += index.pages[pageNum];
  }
  const localPos = position - acc;

  const pageRecords = await readPage(getPageFile(collection, pageNum));
  return pageRecords[localPos] || null;
};
