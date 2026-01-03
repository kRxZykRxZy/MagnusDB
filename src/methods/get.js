// Object.get(Collection, Position);
import { readIndex, readPage, getPageFile } from "../../utils.js";

export default async function(collection, position) {
  if (position === undefined) {
    // return all records
    const index = await readIndex(collection);
    const all = [];
    for (let i = 0; i < index.pages.length; i++) {
      const page = await readPage(getPageFile(collection, i));
      all.push(...page);
    }
    return all;
  } else {
    return await (await import("./fetch.js")).default(`${collection}:${position}`);
  }
};
