// Smoke check: run `npm run dev` first, then `node scripts/smoke.mjs 0x<address>`
import assert from "node:assert/strict";

const addr = process.argv[2];
assert(addr, "usage: node scripts/smoke.mjs 0x<address>");
const base = process.env.SMOKE_BASE ?? "http://localhost:3000";

const checks = [
    [`/api/token-stats`, (d) => assert(d && typeof d === "object", "token-stats empty")],
    [`/api/user/${addr}`, (d) => assert(typeof d.totalDeposits === "string", "user.totalDeposits not a string")],
    [`/api/dashboard/${addr}`, (d) => {
        assert(d.user, "dashboard.user missing");
        assert(Array.isArray(d.investments), "dashboard.investments not an array");
    }],
    // /api/downlines has maxDuration=60 server-side — a large team scan can legitimately
    // take close to that, so give it a longer client timeout than the rest.
    [`/api/downlines/${addr}?depth=1`, (d) => assert(d !== null && d !== undefined, "downlines empty"), 90_000],
];

let failed = 0;
for (const [path, check, timeout = 30_000] of checks) {
    const started = Date.now();
    try {
        const res = await fetch(base + path, { signal: AbortSignal.timeout(timeout) });
        assert.equal(res.status, 200, `${path} returned ${res.status}`);
        check(await res.json());
        console.log(`ok   ${path}  ${Date.now() - started}ms`);
    } catch (err) {
        failed++;
        console.error(`FAIL ${path}  ${Date.now() - started}ms  ${err.message}`);
    }
}
process.exit(failed === 0 ? 0 : 1);
