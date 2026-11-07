const assert = require("node:assert/strict");
const { test } = require("node:test");
const { once } = require("node:events");

// Exercise the real Express app with a stubbed pg pool; no database is mutated.
let queries = [];
let result = { rows: [] };
let failure;
require.cache[require.resolve("../db")] = {
  id: require.resolve("../db"),
  filename: require.resolve("../db"),
  loaded: true,
  exports: {
    async query(sql, values) {
      queries.push({ sql, values });
      if (failure) throw failure;
      return result;
    }
  }
};
const app = require("../index");

test("expense REST API", async t => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const expense = {
    id: 1, title: "Lunch", amount: 250.5, category: "Food",
    expense_date: "2026-11-07", created_at: "2026-11-07T10:00:00Z"
  };
  async function request(method, path, body) {
    return fetch(`${base}/api/expenses${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
  }

  await t.test("GET collection returns rows", async () => {
    result = { rows: [expense] };
    const response = await request("GET", "");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [expense]);
    assert.match(queries.at(-1).sql, /FROM expenses ORDER BY/);
  });

  await t.test("GET item uses a parameterized id", async () => {
    const response = await request("GET", "/1");
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), expense);
    assert.deepEqual(queries.at(-1).values, ["1"]);
  });

  await t.test("POST returns 201 and treats SQL-like text as data", async () => {
    const title = "Lunch'); DROP TABLE expenses; --";
    const response = await request("POST", "", {
      title, amount: 250.5, category: " Food ", expense_date: "2026-11-07"
    });
    assert.equal(response.status, 201);
    assert.equal(response.headers.get("location"), "/api/expenses/1");
    assert(!queries.at(-1).sql.includes(title));
    assert.deepEqual(queries.at(-1).values, [title, 250.5, "Food", "2026-11-07"]);
  });

  await t.test("PATCH changes only supplied fields", async () => {
    const response = await request("PATCH", "/1", { amount: 300 });
    assert.equal(response.status, 200);
    assert.match(queries.at(-1).sql, /SET amount = \$1 WHERE id = \$2/);
    assert.deepEqual(queries.at(-1).values, [300, "1"]);
  });

  await t.test("DELETE returns an empty 204 response", async () => {
    const response = await request("DELETE", "/1");
    assert.equal(response.status, 204);
    assert.equal(await response.text(), "");
    assert.deepEqual(queries.at(-1).values, ["1"]);
  });

  await t.test("missing records return 404", async () => {
    result = { rows: [] };
    for (const method of ["GET", "PATCH", "DELETE"]) {
      const response = await request(method, "/999", method === "PATCH" ? { title: "New" } : undefined);
      assert.equal(response.status, 404);
    }
  });

  await t.test("invalid input never reaches the database", async () => {
    queries = [];
    for (const id of ["0", "-1", "abc", "1%20OR%201=1", "9223372036854775808"]) {
      assert.equal((await request("GET", `/${id}`)).status, 400);
    }
    for (const body of [null, [], {}, { id: 1 }, { created_at: "today" },
      { title: " " }, { category: null }, { amount: 0 }, { amount: -1 },
      { amount: "10" }, { expense_date: "2026-02-30" }, { expense_date: "2026-13-01" }]) {
      assert.equal((await request("PATCH", "/1", body)).status, 400);
    }
    assert.equal((await request("POST", "", { title: "Missing fields" })).status, 400);
    assert.equal(queries.length, 0);
  });

  await t.test("malformed JSON returns 400", async () => {
    const response = await fetch(`${base}/api/expenses`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: '{"title":'
    });
    assert.equal(response.status, 400);
  });

  await t.test("database failures are safe and constraints map to HTTP status", async () => {
    for (const [code, status] of [["ECONNREFUSED", 500], ["23505", 409], ["23514", 400]]) {
      failure = Object.assign(new Error("SECRET_DATABASE_PASSWORD"), { code });
      const response = await request("GET", "");
      assert.equal(response.status, status);
      assert(!(await response.text()).includes("SECRET_DATABASE_PASSWORD"));
    }
    failure = undefined;
  });
});
