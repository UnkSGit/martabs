import test from "node:test";
import assert from "node:assert/strict";
import { applyLinkCheckResult } from "../src/shared/link-health.js";

const now = Date.UTC(2026, 4, 24);

test("failure records status and increments consecutive failures", () => {
  const state = applyLinkCheckResult(null, {
    ok: false,
    status: 404,
    checkedAt: now
  });

  assert.equal(state.consecutiveFailures, 1);
  assert.equal(state.lastStatus, 404);
  assert.equal(state.lastCheckedAt, now);
});

test("success resets failures", () => {
  const state = applyLinkCheckResult(
    { consecutiveFailures: 4, lastStatus: 404 },
    { ok: true, status: 200, checkedAt: now }
  );

  assert.equal(state.consecutiveFailures, 0);
  assert.equal(state.lastStatus, 200);
  assert.equal(state.lastSuccessAt, now);
});
