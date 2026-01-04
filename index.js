import { config } from "./config.js";
import { getDB } from "./src/db.js";

const db = await getDB();

export { config, db };
