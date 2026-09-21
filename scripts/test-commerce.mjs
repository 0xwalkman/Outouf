import { DatabaseSync } from "node:sqlite";
import { readFileSync, readdirSync } from "node:fs";
import assert from "node:assert/strict";
const db = new DatabaseSync(":memory:");
db.exec("PRAGMA foreign_keys=ON");
for (const file of readdirSync("drizzle").filter(name => name.endsWith(".sql")).sort()) {
  db.exec(readFileSync("drizzle/" + file, "utf8"));
}
db.prepare("INSERT INTO products (id,title,category,price_usdc,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?)").run("p1","Test scarf","Scarves",28000000,1,1,1);
const route = readFileSync("app/api/cart/route.ts","utf8");
const insert = route.match(/prepare\(`(INSERT INTO cart_items[\s\S]*?)`\)/)[1];
const select = route.match(/prepare\(`(SELECT c.product_id[\s\S]*?)`\)/)[1];
db.prepare(insert).run("cart1","alice",2,1,"p1");
db.prepare(insert).run("cart2","bob",3,2,"p1");
assert.equal(db.prepare(select).all("alice")[0].quantity,2);
assert.equal(db.prepare(select).all("bob")[0].quantity,3);
db.prepare(insert).run("cart3","alice",4,3,"p1");
assert.equal(db.prepare(select).all("alice").length,1);
assert.equal(db.prepare(select).all("alice")[0].quantity,4);
db.prepare("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?").run("alice","p1");
assert.equal(db.prepare(select).all("alice").length,0);
assert.equal(db.prepare(select).all("bob")[0].quantity,3);
db.prepare("UPDATE products SET active=0 WHERE id=?").run("p1");
assert.equal(db.prepare(insert).run("cart4","alice",1,4,"p1").changes,0);
assert.equal(db.prepare(insert).run("cart5","alice",1,5,"missing").changes,0);
assert.equal(db.prepare(select).all("bob")[0].active,0);
assert.equal(db.prepare(select).all("bob")[0].priceUsdc,28000000);
db.close();
console.log("PASS: migrations, exact prices, cart upsert, account isolation, scoped removal, inactive/missing product rejection.");
