# MagnusDB

**Copyright 2026 MagnusDB**
**Licensed under the Apache License, Version 2.0**

MagnusDB is a **file-based, high-performance JavaScript database**. It stores collections as pages of records in `.dat` files, with JSON indexes for fast lookup.
All methods are accessible via the `db` object, dynamically loaded from the `methods` folder.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Collections & Records](#collections--records)
3. [Core Methods](#core-methods)
4. [Utility Methods](#utility-methods)
5. [Backup & Maintenance](#backup--maintenance)
6. [Examples](#examples)

---

## Getting Started

```js
import db from "./db.js";

// Insert a record
await db.insert("users", { id: 1, name: "Alice" });

// Fetch all records
const users = await db.all("users");

// Fetch a single record
const firstUser = await db.get("users:0");

// Update a record
await db.update("users:0", { name: "Bob" });

// Delete a record
await db.delete("users:0");
```

All operations are **async** and support **multi-threaded writes** if enabled in `config.js`.

---

## Collections & Records

* A **collection** is a folder inside the `collections` directory.
* Each collection stores **pages** as `.dat` files, each with multiple records.
* Metadata is stored in an **index file** `_index.json` with:

  * `totalRecords`: total records in the collection
  * `pages`: array of page sizes

---

## Core Methods

| Method     | Signature                            | Description                                                                                             |
| ---------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `insert`   | `(collection, record)`               | Adds a new record to a collection. Handles paging automatically.                                        |
| `get`      | `(collection:position)`              | Fetches a record by global position. If no position is provided, returns all records in the collection. |
| `fetch`    | `(collection:position)`              | Fetches a single record by global position. Faster than `get` when fetching one record.                 |
| `all`      | `(collection)`                       | Returns all records in the collection. Internally calls `get`.                                          |
| `update`   | `(collection:position, newData)`     | Updates a record at a specific position. Merges `newData` with existing record.                         |
| `upsert`   | `(collection, record, idField="id")` | Updates an existing record if `idField` matches, otherwise inserts it.                                  |
| `delete`   | `(collection:position)`              | Deletes a record at a given position. Returns the deleted record.                                       |
| `exists`   | `(collection:position)`              | Returns `true` if the record exists, otherwise `false`.                                                 |
| `count`    | `(collection)`                       | Returns the total number of records in a collection.                                                    |
| `truncate` | `(collection)`                       | Removes all records in a collection, resets index and pages.                                            |

---

## Utility Methods

| Method    | Signature                                 | Description                                                                        |
| --------- | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `find`    | `(collection, filterFn)`                  | Returns all records in a collection that match the filter function.                |
| `stats`   | `(collection)`                            | Returns stats about a collection: total records, pages, records per page.          |
| `merge`   | `(targetCollection, [sourceCollections])` | Merges multiple collections into a target collection, updating pages and index.    |
| `backup`  | `(collection, backupFolder)`              | Copies a collection (pages + index) to a backup folder.                            |
| `restore` | `(collection, backupFolder)`              | Restores a collection from a backup folder.                                        |
| `import`  | `(importPath)`                            | Imports collections from a `.msgpack` file. Creates collections, pages, and index. |
| `export`  | `(exportPath)`                            | Exports all collections to a `.msgpack` file. Includes pages and index.            |

---

## Multi-threaded Operations

* `insert` and `export/import` support **multi-threading** if `options.mode === "multi"` and `options.threads > 1`.
* Large operations are **offloaded to worker threads** to improve performance.
* Logs progress for each page processed.

---

## Examples

### Insert and Fetch

```js
await db.insert("users", { id: 1, name: "Alice" });
await db.insert("users", { id: 2, name: "Bob" });

const first = await db.get("users:0");
console.log(first); // { id: 1, name: "Alice" }

const allUsers = await db.all("users");
console.log(allUsers);
```

### Update and Upsert

```js
await db.update("users:0", { name: "Alicia" });

await db.upsert("users", { id: 3, name: "Charlie" }); // inserts
await db.upsert("users", { id: 1, name: "Alice Updated" }); // updates
```

### Delete Records

```js
const deleted = await db.delete("users:2");
console.log(deleted); // record deleted
```

### Collection Utilities

```js
console.log(await db.count("users"));
console.log(await db.exists("users:0"));
console.log(await db.find("users", r => r.name.startsWith("A")));
console.log(await db.stats("users"));
```

### Backup / Restore / Merge

```js
await db.backup("users", "./backups");
await db.restore("users", "./backups");
await db.merge("allUsers", ["users", "admins"]);
```

### Import / Export

```js
await db.export("./backup.msgpack");
await db.import("./backup.msgpack");
```

---

## Logging

All methods use **consistent logging**:

```text
[MagnusDB][Insert] Appending record to page 0
[MagnusDB][Fetch] Fetched record at position 0
[MagnusDB][Export] Export complete! Saved to backup.msgpack
```

You can track progress and debug large operations with these logs.

---

## File Structure

```
/magnusdb
  /collections
    /users
      00000.dat
      00001.dat
      _index.json
  /methods
    insert.js
    get.js
    fetch.js
    all.js
    update.js
    upsert.js
    delete.js
    exists.js
    count.js
    truncate.js
    find.js
    stats.js
    merge.js
    backup.js
    restore.js
    import.js
    export.js
  db.js
  utils.js
  config.js
```