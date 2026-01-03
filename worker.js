import fs from "fs";
import { parentPort, workerData } from "worker_threads";

const { pageFile, records } = workerData;

import { encode } from "@msgpack/msgpack";

fs.promises.writeFile(pageFile, encode(records))
  .then(() => parentPort.postMessage({ status: "done" }))
  .catch(err => parentPort.postMessage({ status: "error", error: err }));
