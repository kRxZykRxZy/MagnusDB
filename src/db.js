// Copyright 2026 MagnusDB
// Licensed under the Apache License, Version 2.0

import fs from "fs";
import path from "path";
import { Worker } from "worker_threads";

const db = {};
const methodsDir = path.join(new URL('.', import.meta.url).pathname, "methods");

const files = fs.readdirSync(methodsDir).filter(f => f.endsWith(".js"));

for (const file of files) {
  const mod = await import(path.join(methodsDir, file));
  const name = file.replace(".js", "");
  db[name] = mod.default;
}

export default db;
