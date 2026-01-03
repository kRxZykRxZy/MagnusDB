// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

// Object.all(Collection);
import { get } from "./get.js";

export default async function(collection) {
  return await get(collection);
};
