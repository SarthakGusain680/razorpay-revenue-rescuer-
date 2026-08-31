const BASE = "https://razorpay-revenue-rescuer.vercel.app";
let failed = false;

async function check(name, fn) {
  try {
    await fn();
    console.log(`PASS  ${name}`);
  } catch (e) {
    failed = true;
    console.error(`FAIL  ${name}: ${e.message}`);
  }
}

await check("health endpoint is healthy", async () => {
  const res = await fetch(`${BASE}/api/health`);
  if (!res.ok) throw new Error("status " + res.status);
  const json = await res.json();
  if (json.status !== "healthy") throw new Error("unhealthy");
});

await check("dashboard returns full metrics shape", async () => {
  const res = await fetch(`${BASE}/api/dashboard`);
  if (!res.ok) throw new Error("status " + res.status);
  const json = await res.json();
  for (const key of ["total_abandoned", "total_recovered_count", "total_money_recovered", "carts"])
    if (!(key in json)) throw new Error("missing " + key);
});

await check("simulate rejects invalid payload (422)", async () => {
  const res = await fetch(`${BASE}/api/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cart_value: "not-a-number" }),
  });
  if (res.status !== 422) throw new Error("expected 422, got " + res.status);
});

await check("unknown route returns 404", async () => {
  const res = await fetch(`${BASE}/api/does-not-exist`);
  if (res.status !== 404) throw new Error("expected 404, got " + res.status);
});

console.log(failed ? "\nSome tests FAILED" : "\nAll smoke tests passed");
process.exit(failed ? 1 : 0);