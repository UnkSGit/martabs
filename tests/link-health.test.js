import test from "node:test";
import assert from "node:assert/strict";
import {
  applyLinkCheckResult,
  shouldShowLinkWarning
} from "../src/shared/link-health.js";

const day = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 4, 24);

test("first failure does not show warning", () => {
  const state = applyLinkCheckResult(null, {
    ok: false,
    status: 404,
    checkedAt: now
  });

  assert.equal(state.consecutiveFailures, 1);
  assert.equal(shouldShowLinkWarning(state, now + day * 2), false);
});

test("failure for at least 10 days shows warning", () => {
  const state = {
    firstFailureAt: now - day * 10,
    lastCheckedAt: now,
    lastStatus: 404,
    lastSuccessAt: null,
    consecutiveFailures: 4,
    dismissedAt: null
  };

  assert.equal(shouldShowLinkWarning(state, now), true);
});

test("success resets failures", () => {
  const state = applyLinkCheckResult(
    { firstFailureAt: now - day * 10, consecutiveFailures: 4 },
    { ok: true, status: 200, checkedAt: now }
  );

  assert.equal(state.consecutiveFailures, 0);
  assert.equal(state.firstFailureAt, null);
  assert.equal(state.lastSuccessAt, now);
});
