import assert from "node:assert/strict";
import handler from "../server/online/generated.mjs";
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-unused";
for (const [url, status] of [
  ["/api/health", 200],
  ["/api/metrics", 401],
]) {
  const response = {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(k, v) {
      this.headers[k] = v;
    },
    end(body) {
      this.body = body;
    },
  };
  await handler(
    { url, method: "GET", headers: { host: "example.com" } },
    response,
  );
  assert.equal(response.statusCode, status);
  assert(response.headers["content-type"].includes("application/json"));
  JSON.parse(response.body);
}
console.log("Node ESM runtime checks passed: health and protected API.");
