// Object.all(Collection);
import { get } from "./get.js";

export default async function(collection) {
  return await get(collection);
};
