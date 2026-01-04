import { db, config } from "magnusdb";

config("./db", {
    "mode": "multi",
    "threads": 5,
    "dynamicThreadScaling": true
});

(async () => {
  await db.insert("users", { id: 1, name: "Alice" });
  const users = await db.all("users");
  console.log(users);
})();